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
  const verificationUrl = `http://${host}:${port}/verify-email?token=${options.rawToken}`;

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 20px;">
                <tr>
                  <td style="width: 70px; height: 70px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 36px; line-height: 70px;">✉️</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                Verify Your Email
              </h1>
              <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0; font-size: 16px;">
                Welcome to DEVision!
              </p>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Hello! 👋
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                Thank you for creating an account with us. To complete your registration and start exploring job opportunities, please verify your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 16px 0 32px;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                      Verify My Email
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 13px; word-break: break-all; background-color: #f3f4f6; padding: 12px 16px; border-radius: 8px; margin: 0 0 24px;">
                ${verificationUrl}
              </p>
              
              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                  ⚠️ <strong>Security Notice:</strong> This link expires in 24 hours. If you didn't create an account, please ignore this email.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">
                © ${new Date().getFullYear()} DEVision. All rights reserved.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
Welcome to DEVision!

Thank you for creating an account with us. To complete your registration, please verify your email address by visiting the following link:

${verificationUrl}

This link expires in 24 hours.

If you didn't create an account, please ignore this email.

© ${new Date().getFullYear()} DEVision. All rights reserved.
  `;

  return mailer.sendMail({
    to: options.to,
    subject: '✉️ Verify Your Email - DEVision',
    html: htmlTemplate,
    text: textContent,
  });
}

