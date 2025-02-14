import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

// Initialize Stripe with strict mode checking
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey.startsWith('sk_test_')) {
  throw new Error("Development environment requires a test mode secret key (starts with sk_test_)");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2023-10-16", // Latest stable version
});

const PRODUCTS = {
  SINGLE_SESSION: {
    price: 599, // $5.99 in cents
    currency: "usd",
    name: "Single Sponsor Session"
  },
  MONTHLY_SUBSCRIPTION: {
    price: 3900, // $39.00 in cents
    currency: "usd",
    name: "Monthly Premium Subscription"
  }
};

export async function createPaymentIntent(productType: keyof typeof PRODUCTS) {
  try {
    console.log(`Creating payment intent for ${productType}`);
    const product = PRODUCTS[productType];

    if (!product) {
      throw new Error(`Invalid product type: ${productType}`);
    }

    const intent = await stripe.paymentIntents.create({
      amount: product.price,
      currency: product.currency,
      metadata: {
        product: product.name,
        environment: 'test'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`Successfully created payment intent: ${intent.id}`);
    return intent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
}

export async function createSubscription(customerId: string) {
  try {
    console.log(`Creating subscription for customer: ${customerId}`);
    // First create a price for the subscription
    const price = await stripe.prices.create({
      unit_amount: PRODUCTS.MONTHLY_SUBSCRIPTION.price,
      currency: PRODUCTS.MONTHLY_SUBSCRIPTION.currency,
      recurring: { interval: "month" },
      product_data: {
        name: PRODUCTS.MONTHLY_SUBSCRIPTION.name
      }
    });

    console.log(`Created price: ${price.id}`);

    // Then create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });

    console.log(`Successfully created subscription: ${subscription.id}`);
    return subscription;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

export async function createCustomer(email: string) {
  try {
    console.log(`Creating customer for email: ${email}`);
    const customer = await stripe.customers.create({
      email,
      metadata: {
        source: "sponsor_pocket"
      }
    });
    console.log(`Successfully created customer: ${customer.id}`);
    return customer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}
