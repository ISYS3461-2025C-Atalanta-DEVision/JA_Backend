import { Injectable } from "@nestjs/common";
import { MailerService as NestMailerService } from "@nestjs-modules/mailer";
import { sendEmail, sendEmailVerification } from "./utils/mailer.util";

@Injectable()
export class MailerService {
  constructor(private readonly nestMailer: NestMailerService) {}

  async sendRawEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    await sendEmail(this.nestMailer, {
      to,
      subject,
      html,
      text,
    });
  }

  async sendEmailVerification(to: string, rawToken: string): Promise<void> {
    await sendEmailVerification(this.nestMailer, {
      to,
      rawToken,
    });
  }
}
