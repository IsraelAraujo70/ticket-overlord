import { AuthError } from '../domain/auth.errors';
import { AuthStore } from './ports/auth-store';
import { PasswordHasher } from './ports/password-hasher';
import { TokenGenerator } from './ports/token-generator';
import { SessionService } from './session.service';

describe('SessionService', () => {
  it('creates a session only for verified credentials', async () => {
    const createSession = jest.fn().mockResolvedValue(undefined);
    const store = {
      createSession,
      findCredentialsByEmail: jest.fn().mockResolvedValue({
        id: 'user-id',
        fullName: 'Maria Cliente',
        email: 'maria@example.com',
        role: 'CUSTOMER',
        organizationId: null,
        passwordHash: 'password-hash',
        emailVerifiedAt: new Date('2026-08-11T12:00:00Z'),
      }),
    } as unknown as AuthStore;
    const passwordHasher = {
      verify: jest.fn().mockResolvedValue(true),
    } as unknown as PasswordHasher;
    const tokenGenerator = {
      generate: jest.fn().mockReturnValue({
        raw: 'session-token',
        hash: 'session-hash',
        expiresAt: new Date('2026-08-18T12:00:00Z'),
      }),
    } as unknown as TokenGenerator;
    const service = new SessionService(store, passwordHasher, tokenGenerator);

    await expect(
      service.login({
        email: 'MARIA@EXAMPLE.COM',
        password: 'StrongPassword2026!',
      }),
    ).resolves.toMatchObject({
      accessToken: 'session-token',
      user: { id: 'user-id', role: 'CUSTOMER' },
    });
    expect(createSession).toHaveBeenCalledWith({
      userId: 'user-id',
      tokenHash: 'session-hash',
      expiresAt: new Date('2026-08-18T12:00:00Z'),
    });
  });

  it('rejects an unverified account', async () => {
    const store = {
      findCredentialsByEmail: jest.fn().mockResolvedValue({
        id: 'user-id',
        fullName: 'Maria Cliente',
        email: 'maria@example.com',
        role: 'CUSTOMER',
        organizationId: null,
        passwordHash: 'password-hash',
        emailVerifiedAt: null,
      }),
    } as unknown as AuthStore;
    const passwordHasher = {
      verify: jest.fn().mockResolvedValue(true),
    } as unknown as PasswordHasher;
    const tokenGenerator = {} as TokenGenerator;
    const service = new SessionService(store, passwordHasher, tokenGenerator);

    await expect(
      service.login({ email: 'maria@example.com', password: 'password' }),
    ).rejects.toMatchObject<Partial<AuthError>>({ code: 'EMAIL_NOT_VERIFIED' });
  });
});
