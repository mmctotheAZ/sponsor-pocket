import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const msg = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData,
      text: params.text || '',
      html: params.html || ''
    };

    await mailService.send(msg);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Email templates for different notification types
export const EMAIL_TEMPLATES = {
  PAYMENT_SUCCESS: 'd-xxxxxxxxxxxxx', // Replace with your SendGrid template ID
  SPONSOR_MESSAGE: 'd-xxxxxxxxxxxxx', // Replace with your SendGrid template ID
};

export const DEFAULT_FROM_EMAIL = 'notifications@sponsorpocket.com';