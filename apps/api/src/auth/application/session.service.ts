import { Injectable } from '@nestjs/common';
import { AuthError } from '../domain/auth.errors';
import type { AuthenticatedSession } from '../domain/auth.types';
import { AuthStore } from './ports/auth-store';
import { PasswordHasher } from './ports/password-hasher';
import { TokenGenerator } from './ports/token-generator';

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  expiresAt: string;
  user: AuthenticatedSession['user'];
}

@Injectable()
export class SessionService {
  constructor(
    private readonly store: AuthStore,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async login(command: LoginCommand): Promise<LoginResult> {
    const account = await this.store.findCredentialsByEmail(
      command.email.trim().toLowerCase(),
    );

    if (!account) {
      await this.passwordHasher.hash(command.password);
      throw new AuthError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    const passwordMatches = await this.passwordHasher.verify(
      command.password,
      account.passwordHash,
    );

    if (!passwordMatches) {
      throw new AuthError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    if (!account.emailVerifiedAt) {
      throw new AuthError(
        'EMAIL_NOT_VERIFIED',
        'Confirme seu e-mail antes de entrar.',
      );
    }

    const session = this.tokenGenerator.generate(SESSION_TTL);
    await this.store.createSession({
      userId: account.id,
      tokenHash: session.hash,
      expiresAt: session.expiresAt,
    });

    return {
      accessToken: session.raw,
      expiresAt: session.expiresAt.toISOString(),
      user: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        role: account.role,
        organizationId: account.organizationId,
      },
    };
  }

  authenticate(rawToken: string): Promise<AuthenticatedSession | null> {
    return this.store.findSession(
      this.tokenGenerator.hash(rawToken),
      new Date(),
    );
  }

  logout(tokenHash: string): Promise<void> {
    return this.store.revokeSession(tokenHash, new Date());
  }
}
