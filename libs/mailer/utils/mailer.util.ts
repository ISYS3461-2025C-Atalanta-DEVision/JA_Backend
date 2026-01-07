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
    rawToken: string;
  },
) {
  if (!options.to) {
    throw new Error('Recipient email missing');
  }
  const host = process.env.API_GATEWAY_HOST ?? 'localhost';
  const port = process.env.API_GATEWAY_PORT ?? '3000';

  const verificationUrl =
    `http://${host}:${port}/verify-email?token=${options.rawToken}`;

  return mailer.sendMail({
    to: options.to,
    subject: 'Verify your email',
    html: `
      <p>Please verify your email:</p>
      <p>${verificationUrl}</p>
      <a href="${verificationUrl}">
        Verify Email
      </a>
    `,
    text: `Verify your email: ${options.rawToken}`,
  });
}
