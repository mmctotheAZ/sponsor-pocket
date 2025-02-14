import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateSponsorResponse } from "./openai";
import { insertMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { stripe, createPaymentIntent, createSubscription, createCustomer } from "./stripe";
import type { Stripe } from "stripe";
import rateLimit from "express-rate-limit";
import { sendEmail, EMAIL_TEMPLATES, DEFAULT_FROM_EMAIL } from "./sendgrid";

export function registerRoutes(app: Express): Server {
  // Rate limiting middleware
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });

  app.use("/api/", apiLimiter);

  // Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);

      // Generate AI response
      const aiResponse = await generateSponsorResponse(validatedData.content);

      const sponsorMessage = {
        userId: validatedData.userId,
        content: aiResponse.message,
        isUser: false
      };

      res.json({
        userMessage: {
          userId: validatedData.userId,
          content: validatedData.content,
          isUser: true
        },
        sponsorMessage,
        supportType: aiResponse.supportType,
        suggestedResources: aiResponse.suggestedResources
      });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ 
          error: "Invalid request format",
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          error: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // Payment routes
  app.post("/api/payments/create-intent", async (req, res) => {
    try {
      const { productType } = req.body;
      console.log("Creating payment intent for product type:", productType);

      if (!productType || !["SINGLE_SESSION", "MONTHLY_SUBSCRIPTION"].includes(productType)) {
        return res.status(400).json({ error: "Invalid product type" });
      }

      const paymentIntent = await createPaymentIntent(productType);
      console.log("Payment intent created successfully");
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ 
        error: "Unable to process payment request",
        details: error.message 
      });
    }
  });

  app.post("/api/payments/create-subscription", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Valid email is required" });
      }

      const customer = await createCustomer(email);
      const subscription = await createSubscription(customer.id);

      const paymentIntent = subscription.latest_invoice as Stripe.Invoice;
      if (!paymentIntent.payment_intent) {
        throw new Error("No payment intent created for subscription");
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret: typeof paymentIntent.payment_intent === 'string' 
          ? paymentIntent.payment_intent 
          : paymentIntent.payment_intent.client_secret
      });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ 
        error: "Unable to create subscription",
        details: error.message 
      });
    }
  });

  // n8n Webhook Endpoints

  // Handle sponsor communication notifications
  app.post("/api/webhooks/n8n/sponsor-communication", async (req, res) => {
    try {
      const { userId, messageContent, recipientEmail } = req.body;

      if (!userId || !messageContent || !recipientEmail) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Send email notification using SendGrid
      const emailSent = await sendEmail({
        to: recipientEmail,
        from: DEFAULT_FROM_EMAIL,
        subject: "New Message from Your Sponsor",
        templateId: EMAIL_TEMPLATES.SPONSOR_MESSAGE,
        dynamicTemplateData: {
          message: messageContent,
          userId: userId
        }
      });

      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email notification" });
      }

      res.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
      console.error("Sponsor communication webhook error:", error);
      res.status(500).json({
        error: "Failed to process sponsor communication",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Handle payment notifications
  app.post("/api/webhooks/n8n/payment-notification", async (req, res) => {
    try {
      const { userId, paymentStatus, amount, customerEmail } = req.body;

      if (!userId || !paymentStatus || !amount || !customerEmail) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Send payment confirmation email
      const emailSent = await sendEmail({
        to: customerEmail,
        from: DEFAULT_FROM_EMAIL,
        subject: "Payment Confirmation - Sponsor Pocket",
        templateId: EMAIL_TEMPLATES.PAYMENT_SUCCESS,
        dynamicTemplateData: {
          amount: (amount / 100).toFixed(2), // Convert cents to dollars
          status: paymentStatus,
          userId: userId
        }
      });

      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send payment notification" });
      }

      res.json({ success: true, message: "Payment notification sent successfully" });
    } catch (error) {
      console.error("Payment notification webhook error:", error);
      res.status(500).json({
        error: "Failed to process payment notification",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Stripe webhook handling
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      if (!sig || !endpointSecret) {
        throw new Error("Missing Stripe webhook signature or secret");
      }

      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );

      // Handle different webhook events
      switch (event.type) {
        case "payment_intent.succeeded":
          console.log("Payment succeeded:", event.data.object.id);
          break;
        case "customer.subscription.created":
          console.log("Subscription created:", event.data.object.id);
          break;
        case "customer.subscription.deleted":
          console.log("Subscription deleted:", event.data.object.id);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Invalid webhook request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}