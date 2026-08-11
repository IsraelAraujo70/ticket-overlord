import { Injectable } from '@nestjs/common';
import { AuthError } from '../domain/auth.errors';
import { isValidCnpj, normalizeCnpj } from '../domain/validation/cnpj';
import { isBrazilianState } from '../domain/validation/brazilian-state';
import { normalizeBrazilianPhone } from '../domain/validation/phone';
import { EmailVerificationService } from './email-verification.service';
import { AuthStore, type OrganizationRegistration } from './ports/auth-store';
import { PasswordHasher } from './ports/password-hasher';
import { TokenGenerator } from './ports/token-generator';

const EMAIL_CONFIRMATION_TTL = 24 * 60 * 60 * 1000;

export interface RegisterAccountCommand {
  accountType: 'customer' | 'organizer';
  fullName: string;
  email: string;
  password: string;
  organization?: {
    name: string;
    cnpj: string;
    phone: string;
    address: {
      postalCode: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
    };
  };
}

export interface RegistrationResult {
  status: 'EMAIL_CONFIRMATION_REQUIRED';
}

@Injectable()
export class RegistrationService {
  constructor(
    private readonly store: AuthStore,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  async register(command: RegisterAccountCommand): Promise<RegistrationResult> {
    const organization = normalizeOrganization(command);
    const role = command.accountType === 'organizer' ? 'ORGANIZER' : 'CUSTOMER';
    const confirmation = this.tokenGenerator.generate(EMAIL_CONFIRMATION_TTL);
    const account = await this.store.registerAccount({
      fullName: command.fullName.trim(),
      email: normalizeEmail(command.email),
      passwordHash: await this.passwordHasher.hash(command.password),
      role,
      organization,
      confirmationTokenHash: confirmation.hash,
      confirmationExpiresAt: confirmation.expiresAt,
    });

    await this.emailVerification.deliver({
      userId: account.id,
      email: account.email,
      fullName: account.fullName,
      role: account.role,
      token: confirmation.raw,
      tokenHash: confirmation.hash,
    });

    return { status: 'EMAIL_CONFIRMATION_REQUIRED' };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOrganization(
  command: RegisterAccountCommand,
): OrganizationRegistration | null {
  if (command.accountType !== 'organizer') {
    return null;
  }

  if (!command.organization) {
    throw new AuthError(
      'ORGANIZATION_REQUIRED',
      'Os dados da organização são obrigatórios.',
    );
  }

  const cnpj = normalizeCnpj(command.organization.cnpj);
  const phone = normalizeBrazilianPhone(command.organization.phone);
  const postalCode = command.organization.address.postalCode.replace(/\D/g, '');
  const state = command.organization.address.state.trim().toUpperCase();

  if (!isValidCnpj(cnpj)) {
    throw new AuthError('INVALID_CNPJ', 'Informe um CNPJ válido.');
  }

  if (!phone) {
    throw new AuthError('INVALID_PHONE', 'Informe um telefone válido.');
  }

  if (!/^\d{8}$/.test(postalCode)) {
    throw new AuthError('INVALID_POSTAL_CODE', 'Informe um CEP válido.');
  }

  if (!isBrazilianState(state)) {
    throw new AuthError('INVALID_STATE', 'Informe uma UF válida.');
  }

  const address = command.organization.address;
  return {
    name: command.organization.name.trim(),
    cnpj,
    phone,
    postalCode,
    street: address.street.trim(),
    number: address.number.trim(),
    complement: address.complement?.trim() || null,
    neighborhood: address.neighborhood.trim(),
    city: address.city.trim(),
    state,
  };
}
