import { EmailVerificationService } from './email-verification.service';
import { AuthStore } from './ports/auth-store';
import { PasswordHasher } from './ports/password-hasher';
import { TokenGenerator } from './ports/token-generator';
import { RegistrationService } from './registration.service';

describe('RegistrationService', () => {
  it('normalizes and delegates atomic customer registration', async () => {
    const registerAccount = jest.fn().mockResolvedValue({
      id: 'user-id',
      fullName: 'Maria Cliente',
      email: 'maria@example.com',
      role: 'CUSTOMER',
    });
    const store = { registerAccount } as unknown as AuthStore;
    const passwordHasher = {
      hash: jest.fn().mockResolvedValue('password-hash'),
    } as unknown as PasswordHasher;
    const tokenGenerator = {
      generate: jest.fn().mockReturnValue({
        raw: 'confirmation-token',
        hash: 'confirmation-hash',
        expiresAt: new Date('2026-08-12T12:00:00Z'),
      }),
    } as unknown as TokenGenerator;
    const deliver = jest.fn().mockResolvedValue(undefined);
    const emailVerification = {
      deliver,
    } as unknown as EmailVerificationService;
    const service = new RegistrationService(
      store,
      passwordHasher,
      tokenGenerator,
      emailVerification,
    );

    await expect(
      service.register({
        accountType: 'customer',
        fullName: ' Maria Cliente ',
        email: ' MARIA@EXAMPLE.COM ',
        password: 'StrongPassword2026!',
      }),
    ).resolves.toEqual({ status: 'EMAIL_CONFIRMATION_REQUIRED' });
    expect(registerAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'maria@example.com',
        fullName: 'Maria Cliente',
        organization: null,
        passwordHash: 'password-hash',
        role: 'CUSTOMER',
      }),
    );
    expect(deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'maria@example.com',
        token: 'confirmation-token',
      }),
    );
  });

  it('normalizes organizer CNPJ, Brazilian phone and state before persistence', async () => {
    const registerAccount = jest.fn().mockResolvedValue({
      id: 'organizer-id',
      fullName: 'Olívia Organizadora',
      email: 'organizer@example.com',
      role: 'ORGANIZER',
    });
    const service = new RegistrationService(
      { registerAccount } as unknown as AuthStore,
      {
        hash: jest.fn().mockResolvedValue('password-hash'),
      } as unknown as PasswordHasher,
      {
        generate: jest.fn().mockReturnValue({
          raw: 'confirmation-token',
          hash: 'confirmation-hash',
          expiresAt: new Date('2026-08-12T12:00:00Z'),
        }),
      } as unknown as TokenGenerator,
      {
        deliver: jest.fn().mockResolvedValue(undefined),
      } as unknown as EmailVerificationService,
    );

    await service.register({
      accountType: 'organizer',
      fullName: 'Olívia Organizadora',
      email: 'organizer@example.com',
      password: 'StrongPassword2026!',
      organization: {
        name: 'Aurora Eventos',
        cnpj: '12.abc.345/01de-35',
        phone: '+55 35 99742-1900',
        address: {
          postalCode: '37705-202',
          street: 'Rua Lasarina Alvisi Torraca',
          number: '850',
          neighborhood: 'Jardim Amaryllis',
          city: 'Poços de Caldas',
          state: 'mg',
        },
      },
    });

    expect(registerAccount).toHaveBeenCalledWith({
      fullName: 'Olívia Organizadora',
      email: 'organizer@example.com',
      passwordHash: 'password-hash',
      role: 'ORGANIZER',
      organization: {
        name: 'Aurora Eventos',
        cnpj: '12ABC34501DE35',
        phone: '+5535997421900',
        postalCode: '37705202',
        street: 'Rua Lasarina Alvisi Torraca',
        number: '850',
        complement: null,
        neighborhood: 'Jardim Amaryllis',
        city: 'Poços de Caldas',
        state: 'MG',
      },
      confirmationTokenHash: 'confirmation-hash',
      confirmationExpiresAt: new Date('2026-08-12T12:00:00Z'),
    });
  });
});
