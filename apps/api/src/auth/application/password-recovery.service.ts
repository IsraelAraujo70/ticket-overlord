import { Inject, Injectable, Logger } from '@nestjs/common';
import { AuthError } from '../domain/auth.errors';
import { AuthStore } from './ports/auth-store';
import { EMAIL_SENDER, type EmailSender } from './ports/email-sender';
import { PasswordHasher } from './ports/password-hasher';
import { TokenGenerator } from './ports/token-generator';

const PASSWORD_RESET_TTL = 60 * 60 * 1000;

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name);

  constructor(
    private readonly store: AuthStore,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
  ) {}

  async requestReset(rawEmail: string): Promise<void> {
    const token = this.tokenGenerator.generate(PASSWORD_RESET_TTL);
    const recipient = await this.store.replacePasswordResetToken({
      email: rawEmail.trim().toLowerCase(),
      tokenHash: token.hash,
      expiresAt: token.expiresAt,
      now: new Date(),
    });

    if (!recipient) {
      return;
    }

    try {
      await this.emailSender.sendPasswordReset({
        recipient: recipient.email,
        recipientName: recipient.fullName,
        role: recipient.role,
        token: token.raw,
        idempotencyKey: `password-reset/${token.hash}`,
      });
    } catch (error) {
      this.logger.error(
        `Password reset email delivery failed for user ${recipient.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async reset(rawToken: string, password: string): Promise<void> {
    const reset = await this.store.resetPasswordAndRevokeSessions({
      tokenHash: this.tokenGenerator.hash(rawToken),
      passwordHash: await this.passwordHasher.hash(password),
      now: new Date(),
    });

    if (!reset) {
      throw new AuthError(
        'INVALID_OR_EXPIRED_TOKEN',
        'O link de recuperação é inválido ou expirou.',
      );
    }
  }
}
