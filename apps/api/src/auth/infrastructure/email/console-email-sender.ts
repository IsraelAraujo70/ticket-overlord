import { Logger } from '@nestjs/common';
import type {
  EmailSender,
  TransactionalEmail,
} from '../../application/ports/email-sender';
import { confirmationLink, passwordResetLink } from './email-links';

export class ConsoleEmailSender implements EmailSender {
  private readonly logger = new Logger(ConsoleEmailSender.name);

  constructor(private readonly baseUrl: string) {}

  sendEmailConfirmation(message: TransactionalEmail): Promise<void> {
    this.logger.log(
      `Development email confirmation for ${message.recipient}: ${confirmationLink(this.baseUrl, message.role, message.token)}`,
    );
    return Promise.resolve();
  }

  sendPasswordReset(message: TransactionalEmail): Promise<void> {
    this.logger.log(
      `Development password reset for ${message.recipient}: ${passwordResetLink(this.baseUrl, message.role, message.token)}`,
    );
    return Promise.resolve();
  }
}
