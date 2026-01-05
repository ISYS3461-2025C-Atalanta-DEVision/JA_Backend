import { MailerService } from '@nestjs-modules/mailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(
  mailer: MailerService,
  options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  },
) {
  if (!options.to) {
    throw new Error('Recipient email missing');
  }

  return mailer.sendMail({
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendEmailVerification(
  mailer: MailerService,
  options: {
    to: string;
    verificationUrl: string;
  },
) {
  if (!options.to) {
    throw new Error('Recipient email missing');
  }

  return mailer.sendMail({
    to: options.to,
    subject: 'Verify your email',
    html: `
      <p>Please verify your email:</p>
      <a href="${options.verificationUrl}">
        Verify Email
      </a>
    `,
    text: `Verify your email: ${options.verificationUrl}`,
  });
}
