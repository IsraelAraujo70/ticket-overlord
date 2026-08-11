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
});
