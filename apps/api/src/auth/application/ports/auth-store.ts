import type {
  AuthenticatedSession,
  AuthenticatedUser,
} from '../../domain/auth.types';
import type { UserRole } from '../../domain/user-role';

export interface OrganizationRegistration {
  name: string;
  cnpj: string;
  phone: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export interface RegisterAccountInput {
  fullName: string;
  email: string;
  passwordHash: string;
  role: Extract<UserRole, 'CUSTOMER' | 'ORGANIZER'>;
  organization: OrganizationRegistration | null;
  confirmationTokenHash: string;
  confirmationExpiresAt: Date;
}

export interface EmailRecipient {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AccountCredentials extends AuthenticatedUser {
  passwordHash: string;
  emailVerifiedAt: Date | null;
}

export interface ReplaceTokenInput {
  email: string;
  tokenHash: string;
  expiresAt: Date;
  now: Date;
}

export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface ResetPasswordInput {
  tokenHash: string;
  passwordHash: string;
  now: Date;
}

export abstract class AuthStore {
  abstract registerAccount(
    input: RegisterAccountInput,
  ): Promise<EmailRecipient>;

  abstract confirmEmail(tokenHash: string, now: Date): Promise<boolean>;

  abstract replaceEmailConfirmationToken(
    input: ReplaceTokenInput,
  ): Promise<EmailRecipient | null>;

  abstract findCredentialsByEmail(
    email: string,
  ): Promise<AccountCredentials | null>;

  abstract createSession(input: CreateSessionInput): Promise<void>;

  abstract findSession(
    tokenHash: string,
    now: Date,
  ): Promise<AuthenticatedSession | null>;

  abstract revokeSession(tokenHash: string, now: Date): Promise<void>;

  abstract replacePasswordResetToken(
    input: ReplaceTokenInput,
  ): Promise<EmailRecipient | null>;

  abstract resetPasswordAndRevokeSessions(
    input: ResetPasswordInput,
  ): Promise<boolean>;
}
