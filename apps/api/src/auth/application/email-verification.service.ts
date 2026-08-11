import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthError } from '../domain/auth.errors';
import type { AuthenticatedUser } from '../domain/auth.types';
import type { UserRole } from '../domain/user-role';
import { AuthStore } from './ports/auth-store';
import { EMAIL_SENDER, type EmailSender } from './ports/email-sender';
import { TokenGenerator } from './ports/token-generator';

const EMAIL_CONFIRMATION_TTL = 24 * 60 * 60 * 1000;
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface ConfirmationDelivery {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  token: string;
  tokenHash: string;
}

export type EmailConfirmationResult =
  | {
      status: 'CONFIRMED';
      session: {
        accessToken: string;
        expiresAt: string;
        user: AuthenticatedUser;
      };
    }
  | { status: 'ALREADY_CONFIRMED' };

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly store: AuthStore,
    private readonly tokenGenerator: TokenGenerator,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
  ) {}

  async confirm(rawToken: string): Promise<EmailConfirmationResult> {
    const session = this.tokenGenerator.generate(SESSION_TTL);
    const confirmation = await this.store.confirmEmail({
      tokenHash: this.tokenGenerator.hash(rawToken),
      sessionTokenHash: session.hash,
      sessionExpiresAt: session.expiresAt,
      now: new Date(),
    });

    if (confirmation.status === 'invalid') {
      throw new AuthError(
        'INVALID_OR_EXPIRED_TOKEN',
        'O link de confirmação é inválido ou expirou.',
      );
    }

    if (confirmation.status === 'already_confirmed') {
      return { status: 'ALREADY_CONFIRMED' };
    }

    return {
      status: 'CONFIRMED',
      session: {
        accessToken: session.raw,
        expiresAt: session.expiresAt.toISOString(),
        user: confirmation.user,
      },
    };
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
