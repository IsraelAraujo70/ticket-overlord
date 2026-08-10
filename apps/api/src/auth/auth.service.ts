import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  authSessions,
  authTokens,
  organizationMembers,
  organizations,
  users,
  type UserRole,
} from '../database/schema';
import { AuthError } from './auth.errors';
import type {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from './dto/auth.dto';
import type { LoginResponseDto } from './dto/auth-response.dto';
import { EMAIL_SENDER, type EmailSender } from './email/email-sender';
import { PasswordHasher } from './security/password-hasher';
import { TokenService } from './security/token-service';
import type { AuthenticatedSession, AuthenticatedUser } from './auth.types';
import { isValidCnpj, normalizeCnpj } from './validation/cnpj';

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const EMAIL_CONFIRMATION_TTL = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL = 60 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function normalizePostalCode(postalCode: string): string {
  return postalCode.replace(/\D/g, '');
}

function postgresConstraint(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const candidate = error as { code?: unknown; constraint?: unknown };
  return candidate.code === '23505' && typeof candidate.constraint === 'string'
    ? candidate.constraint
    : undefined;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DATABASE) private readonly database: Database,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ status: 'EMAIL_CONFIRMATION_REQUIRED' }> {
    const email = normalizeEmail(dto.email);
    const passwordHash = await this.passwordHasher.hash(dto.password);
    const role: UserRole =
      dto.accountType === 'organizer' ? 'ORGANIZER' : 'CUSTOMER';

    let cnpj: string | undefined;
    let phone: string | undefined;

    if (dto.accountType === 'organizer') {
      if (!dto.organization) {
        throw new AuthError(
          'ORGANIZATION_REQUIRED',
          'Os dados da organização são obrigatórios.',
        );
      }

      cnpj = normalizeCnpj(dto.organization.cnpj);
      phone = normalizePhone(dto.organization.phone);
      const postalCode = normalizePostalCode(
        dto.organization.address.postalCode,
      );
      const state = dto.organization.address.state.trim().toUpperCase();

      if (!isValidCnpj(cnpj)) {
        throw new AuthError('INVALID_CNPJ', 'Informe um CNPJ válido.');
      }

      if (!/^\d{10,11}$/.test(phone)) {
        throw new AuthError('INVALID_PHONE', 'Informe um telefone válido.');
      }

      if (!/^\d{8}$/.test(postalCode)) {
        throw new AuthError('INVALID_POSTAL_CODE', 'Informe um CEP válido.');
      }

      if (!/^[A-Z]{2}$/.test(state)) {
        throw new AuthError('INVALID_STATE', 'Informe uma UF válida.');
      }
    }

    const confirmation = this.tokenService.generate(EMAIL_CONFIRMATION_TTL);
    let userId: string;

    try {
      userId = await this.database.transaction(async (transaction) => {
        const [createdUser] = await transaction
          .insert(users)
          .values({
            fullName: dto.fullName.trim(),
            email,
            passwordHash,
            role,
          })
          .returning({ id: users.id });

        if (!createdUser) {
          throw new Error('User insert did not return an id.');
        }

        if (
          dto.accountType === 'organizer' &&
          dto.organization &&
          cnpj &&
          phone
        ) {
          const address = dto.organization.address;
          const [organization] = await transaction
            .insert(organizations)
            .values({
              name: dto.organization.name.trim(),
              cnpj,
              phone,
              postalCode: normalizePostalCode(address.postalCode),
              street: address.street.trim(),
              number: address.number.trim(),
              complement: address.complement?.trim() || null,
              neighborhood: address.neighborhood.trim(),
              city: address.city.trim(),
              state: address.state.trim().toUpperCase(),
            })
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
          tokenHash: confirmation.hash,
          expiresAt: confirmation.expiresAt,
        });

        return createdUser.id;
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

    await this.deliverEmailConfirmation({
      userId,
      email,
      fullName: dto.fullName.trim(),
      role,
      token: confirmation.raw,
      tokenHash: confirmation.hash,
    });

    return { status: 'EMAIL_CONFIRMATION_REQUIRED' };
  }

  async confirmEmail(dto: TokenDto): Promise<void> {
    const tokenHash = this.tokenService.hash(dto.token);
    const now = new Date();

    const confirmed = await this.database.transaction(async (transaction) => {
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

    if (!confirmed) {
      throw new AuthError(
        'INVALID_OR_EXPIRED_TOKEN',
        'O link de confirmação é inválido ou expirou.',
      );
    }
  }

  async resendEmailConfirmation(dto: EmailDto): Promise<void> {
    const email = normalizeEmail(dto.email);
    const [user] = await this.database
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.emailVerifiedAt)))
      .limit(1);

    if (!user) {
      return;
    }

    const token = this.tokenService.generate(EMAIL_CONFIRMATION_TTL);
    const now = new Date();

    await this.database.transaction(async (transaction) => {
      await transaction
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.userId, user.id),
            eq(authTokens.purpose, 'EMAIL_CONFIRMATION'),
            isNull(authTokens.consumedAt),
          ),
        );
      await transaction.insert(authTokens).values({
        userId: user.id,
        purpose: 'EMAIL_CONFIRMATION',
        tokenHash: token.hash,
        expiresAt: token.expiresAt,
      });
    });

    await this.deliverEmailConfirmation({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token: token.raw,
      tokenHash: token.hash,
    });
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const email = normalizeEmail(dto.email);
    const [user] = await this.database
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        passwordHash: users.passwordHash,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      await this.passwordHasher.hash(dto.password);
      throw new AuthError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    const passwordMatches = await this.passwordHasher.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AuthError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }

    if (!user.emailVerifiedAt) {
      throw new AuthError(
        'EMAIL_NOT_VERIFIED',
        'Confirme seu e-mail antes de entrar.',
      );
    }

    const session = this.tokenService.generate(SESSION_TTL);
    await this.database.insert(authSessions).values({
      userId: user.id,
      tokenHash: session.hash,
      expiresAt: session.expiresAt,
    });

    const identity = await this.findAuthenticatedUser(user.id);

    if (!identity) {
      throw new Error('Created session has no user identity.');
    }

    return {
      accessToken: session.raw,
      expiresAt: session.expiresAt.toISOString(),
      user: identity,
    };
  }

  async authenticate(rawToken: string): Promise<AuthenticatedSession | null> {
    const tokenHash = this.tokenService.hash(rawToken);
    const now = new Date();
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

  async logout(tokenHash: string): Promise<void> {
    await this.database
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(authSessions.tokenHash, tokenHash));
  }

  async forgotPassword(dto: EmailDto): Promise<void> {
    const email = normalizeEmail(dto.email);
    const [user] = await this.database
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        and(eq(users.email, email), gt(users.emailVerifiedAt, new Date(0))),
      )
      .limit(1);

    if (!user) {
      return;
    }

    const token = this.tokenService.generate(PASSWORD_RESET_TTL);
    const now = new Date();
    await this.database.transaction(async (transaction) => {
      await transaction
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.userId, user.id),
            eq(authTokens.purpose, 'PASSWORD_RESET'),
            isNull(authTokens.consumedAt),
          ),
        );
      await transaction.insert(authTokens).values({
        userId: user.id,
        purpose: 'PASSWORD_RESET',
        tokenHash: token.hash,
        expiresAt: token.expiresAt,
      });
    });

    try {
      await this.emailSender.sendPasswordReset({
        recipient: user.email,
        recipientName: user.fullName,
        role: user.role,
        token: token.raw,
        idempotencyKey: `password-reset/${token.hash}`,
      });
    } catch (error) {
      this.logger.error(
        `Password reset email delivery failed for user ${user.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.tokenService.hash(dto.token);
    const passwordHash = await this.passwordHasher.hash(dto.password);
    const now = new Date();

    const reset = await this.database.transaction(async (transaction) => {
      const [consumedToken] = await transaction
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.tokenHash, tokenHash),
            eq(authTokens.purpose, 'PASSWORD_RESET'),
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
        .set({ passwordHash, updatedAt: now })
        .where(eq(users.id, consumedToken.userId));
      await transaction
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.userId, consumedToken.userId),
            eq(authTokens.purpose, 'PASSWORD_RESET'),
            isNull(authTokens.consumedAt),
          ),
        );
      await transaction
        .update(authSessions)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authSessions.userId, consumedToken.userId),
            isNull(authSessions.revokedAt),
          ),
        );

      return true;
    });

    if (!reset) {
      throw new AuthError(
        'INVALID_OR_EXPIRED_TOKEN',
        'O link de recuperação é inválido ou expirou.',
      );
    }
  }

  private async findAuthenticatedUser(
    userId: string,
  ): Promise<AuthenticatedUser | null> {
    const [row] = await this.database
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        organizationId: organizationMembers.organizationId,
      })
      .from(users)
      .leftJoin(organizationMembers, eq(organizationMembers.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    return row ?? null;
  }

  private async deliverEmailConfirmation(input: {
    userId: string;
    email: string;
    fullName: string;
    role: UserRole;
    token: string;
    tokenHash: string;
  }): Promise<void> {
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
