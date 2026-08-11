import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthError } from '../domain/auth.errors';
import type { UserRole } from '../domain/user-role';
import { AuthStore } from './ports/auth-store';
import { EMAIL_SENDER, type EmailSender } from './ports/email-sender';
import { TokenGenerator } from './ports/token-generator';

const EMAIL_CONFIRMATION_TTL = 24 * 60 * 60 * 1000;

export interface ConfirmationDelivery {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  token: string;
  tokenHash: string;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly store: AuthStore,
    private readonly tokenGenerator: TokenGenerator,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
  ) {}

  async confirm(rawToken: string): Promise<void> {
    const confirmed = await this.store.confirmEmail(
      this.tokenGenerator.hash(rawToken),
      new Date(),
    );

    if (!confirmed) {
      throw new AuthError(
        'INVALID_OR_EXPIRED_TOKEN',
        'O link de confirmação é inválido ou expirou.',
      );
    }
  }

  async resend(rawEmail: string): Promise<void> {
    const token = this.tokenGenerator.generate(EMAIL_CONFIRMATION_TTL);
    const recipient = await this.store.replaceEmailConfirmationToken({
      email: normalizeEmail(rawEmail),
      tokenHash: token.hash,
      expiresAt: token.expiresAt,
      now: new Date(),
    });

    if (!recipient) {
      return;
    }

    await this.deliver({
      userId: recipient.id,
      email: recipient.email,
      fullName: recipient.fullName,
      role: recipient.role,
      token: token.raw,
      tokenHash: token.hash,
    });
  }

  async deliver(input: ConfirmationDelivery): Promise<void> {
    try {
      await this.emailSender.sendEmailConfirmation({
        recipient: input.email,
        recipientName: input.fullName,
        role: input.role,
        token: input.token,
        idempotencyKey: `email-confirmation/${input.tokenHash}`,
      });
    } catch (error) {
      this.logger.error(
        `Email confirmation delivery failed for user ${input.userId}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
