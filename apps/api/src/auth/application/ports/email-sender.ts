import type { UserRole } from '../../domain/user-role';

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface TransactionalEmail {
  recipient: string;
  recipientName: string;
  role: UserRole;
  token: string;
  idempotencyKey: string;
}

export interface EmailSender {
  sendEmailConfirmation(message: TransactionalEmail): Promise<void>;
  sendPasswordReset(message: TransactionalEmail): Promise<void>;
}
