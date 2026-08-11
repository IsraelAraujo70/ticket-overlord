import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import {
  AuthStore,
  type AccountCredentials,
  type CreateSessionInput,
  type EmailRecipient,
  type RegisterAccountInput,
  type ReplaceTokenInput,
  type ResetPasswordInput,
} from '../../application/ports/auth-store';
import { AuthError } from '../../domain/auth.errors';
import type { AuthenticatedSession } from '../../domain/auth.types';
import { DATABASE } from '../../../database/database.constants';
import {
  authSessions,
  authTokens,
  organizationMembers,
  organizations,
  users,
} from '../../../database/schema';
import type { Database } from '../../../database/database.types';

type TokenPurpose = 'EMAIL_CONFIRMATION' | 'PASSWORD_RESET';

@Injectable()
export class DrizzleAuthStore extends AuthStore {
  constructor(@Inject(DATABASE) private readonly database: Database) {
    super();
  }

  async registerAccount(input: RegisterAccountInput): Promise<EmailRecipient> {
    try {
      return await this.database.transaction(async (transaction) => {
        const [createdUser] = await transaction
          .insert(users)
          .values({
            fullName: input.fullName,
            email: input.email,
            passwordHash: input.passwordHash,
            role: input.role,
          })
          .returning({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            role: users.role,
          });

        if (!createdUser) {
          throw new Error('User insert did not return an id.');
        }

        if (input.organization) {
          const [organization] = await transaction
            .insert(organizations)
            .values(input.organization)
            .returning({ id: organizations.id });

          if (!organization) {
            throw new Error('Organization insert did not return an id.');
          }

          await transaction.insert(organizationMembers).values({
            organizationId: organization.id,
            userId: createdUser.id,
            role: 'OWNER',
          });
        }

        await transaction.insert(authTokens).values({
          userId: createdUser.id,
          purpose: 'EMAIL_CONFIRMATION',
          tokenHash: input.confirmationTokenHash,
          expiresAt: input.confirmationExpiresAt,
        });

        return createdUser;
      });
    } catch (error) {
      const constraint = postgresConstraint(error);

      if (constraint === 'users_email_unique') {
        throw new AuthError(
          'EMAIL_ALREADY_REGISTERED',
          'Já existe uma conta com este e-mail.',
        );
      }

      if (constraint === 'organizations_cnpj_unique') {
        throw new AuthError(
          'CNPJ_ALREADY_REGISTERED',
          'Já existe uma organização com este CNPJ.',
        );
      }

      throw error;
    }
  }

  async confirmEmail(tokenHash: string, now: Date): Promise<boolean> {
    return this.database.transaction(async (transaction) => {
      const [consumedToken] = await transaction
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.tokenHash, tokenHash),
            eq(authTokens.purpose, 'EMAIL_CONFIRMATION'),
            isNull(authTokens.consumedAt),
            gt(authTokens.expiresAt, now),
          ),
        )
        .returning({ userId: authTokens.userId });

      if (!consumedToken) {
        return false;
      }

      await transaction
        .update(users)
        .set({ emailVerifiedAt: now, updatedAt: now })
        .where(eq(users.id, consumedToken.userId));

      return true;
    });
  }

  replaceEmailConfirmationToken(
    input: ReplaceTokenInput,
  ): Promise<EmailRecipient | null> {
    return this.replaceToken(input, 'EMAIL_CONFIRMATION', false);
  }

  async findCredentialsByEmail(
    email: string,
  ): Promise<AccountCredentials | null> {
    const [account] = await this.database
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        organizationId: organizationMembers.organizationId,
        passwordHash: users.passwordHash,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .leftJoin(organizationMembers, eq(organizationMembers.userId, users.id))
      .where(eq(users.email, email))
      .limit(1);

    return account ?? null;
  }

  async createSession(input: CreateSessionInput): Promise<void> {
    await this.database.insert(authSessions).values(input);
  }

  async findSession(
    tokenHash: string,
    now: Date,
  ): Promise<AuthenticatedSession | null> {
    const [row] = await this.database
      .select({
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        organizationId: organizationMembers.organizationId,
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .leftJoin(organizationMembers, eq(organizationMembers.userId, users.id))
      .where(
        and(
          eq(authSessions.tokenHash, tokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, now),
        ),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      tokenHash,
      user: {
        id: row.userId,
        fullName: row.fullName,
        email: row.email,
        role: row.role,
        organizationId: row.organizationId,
      },
    };
  }

  async revokeSession(tokenHash: string, now: Date): Promise<void> {
    await this.database
      .update(authSessions)
      .set({ revokedAt: now })
      .where(eq(authSessions.tokenHash, tokenHash));
  }

  replacePasswordResetToken(
    input: ReplaceTokenInput,
  ): Promise<EmailRecipient | null> {
    return this.replaceToken(input, 'PASSWORD_RESET', true);
  }

  async resetPasswordAndRevokeSessions(
    input: ResetPasswordInput,
  ): Promise<boolean> {
    return this.database.transaction(async (transaction) => {
      const [consumedToken] = await transaction
        .update(authTokens)
        .set({ consumedAt: input.now })
        .where(
          and(
            eq(authTokens.tokenHash, input.tokenHash),
            eq(authTokens.purpose, 'PASSWORD_RESET'),
            isNull(authTokens.consumedAt),
            gt(authTokens.expiresAt, input.now),
          ),
        )
        .returning({ userId: authTokens.userId });

      if (!consumedToken) {
        return false;
      }

      await transaction
        .update(users)
        .set({ passwordHash: input.passwordHash, updatedAt: input.now })
        .where(eq(users.id, consumedToken.userId));
      await transaction
        .update(authTokens)
        .set({ consumedAt: input.now })
        .where(
          and(
            eq(authTokens.userId, consumedToken.userId),
            eq(authTokens.purpose, 'PASSWORD_RESET'),
            isNull(authTokens.consumedAt),
          ),
        );
      await transaction
        .update(authSessions)
        .set({ revokedAt: input.now })
        .where(
          and(
            eq(authSessions.userId, consumedToken.userId),
            isNull(authSessions.revokedAt),
          ),
        );

      return true;
    });
  }

  private replaceToken(
    input: ReplaceTokenInput,
    purpose: TokenPurpose,
    requiresVerifiedEmail: boolean,
  ): Promise<EmailRecipient | null> {
    return this.database.transaction(async (transaction) => {
      const emailCondition = requiresVerifiedEmail
        ? gt(users.emailVerifiedAt, new Date(0))
        : isNull(users.emailVerifiedAt);
      const [recipient] = await transaction
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(and(eq(users.email, input.email), emailCondition))
        .limit(1);

      if (!recipient) {
        return null;
      }

      await transaction
        .update(authTokens)
        .set({ consumedAt: input.now })
        .where(
          and(
            eq(authTokens.userId, recipient.id),
            eq(authTokens.purpose, purpose),
            isNull(authTokens.consumedAt),
          ),
        );
      await transaction.insert(authTokens).values({
        userId: recipient.id,
        purpose,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      });

      return recipient;
    });
  }
}

function postgresConstraint(error: unknown): string | undefined {
  const visited = new Set<object>();
  let current = error;

  while (typeof current === 'object' && current !== null) {
    if (visited.has(current)) {
      return undefined;
    }

    visited.add(current);
    const candidate = current as {
      cause?: unknown;
      code?: unknown;
      constraint?: unknown;
    };

    if (
      candidate.code === '23505' &&
      typeof candidate.constraint === 'string'
    ) {
      return candidate.constraint;
    }

    current = candidate.cause;
  }

  return undefined;
}
