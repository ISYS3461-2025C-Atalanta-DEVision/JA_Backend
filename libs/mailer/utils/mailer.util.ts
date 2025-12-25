import { MailerService } from '@nestjs-modules/mailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(
  mailer: MailerService,
  options: SendEmailOptions,
): Promise<void> {
  await mailer.sendMail(options);
}

export async function sendEmailVerification(
  mailer: MailerService,
  payload: { to: string; verificationUrl: string },
): Promise<void> {
  await sendEmail(mailer, {
    to: payload.to,
    subject: 'Verify your email address',
    html: `
      <p>Welcome!</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${payload.verificationUrl}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
    text: `Verify your email: ${payload.verificationUrl}`,
  });
}
