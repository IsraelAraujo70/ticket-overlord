import { AuthError } from '../domain/auth.errors';
import { EmailVerificationService } from './email-verification.service';
import { AuthStore, type ConfirmEmailInput } from './ports/auth-store';
import type { EmailSender } from './ports/email-sender';
import { TokenGenerator } from './ports/token-generator';

describe('EmailVerificationService', () => {
  it('returns a session when the token confirms the account', async () => {
    const user = {
      id: 'user-id',
      fullName: 'Maria Cliente',
      email: 'maria@example.com',
      role: 'CUSTOMER' as const,
      organizationId: null,
    };
    const store = {
      confirmEmail: jest.fn().mockResolvedValue({ status: 'confirmed', user }),
    } as unknown as AuthStore;
    const tokenGenerator = {
      generate: jest.fn().mockReturnValue({
        raw: 'session-token',
        hash: 'session-hash',
        expiresAt: new Date('2026-08-18T12:00:00Z'),
      }),
      hash: jest.fn().mockReturnValue('confirmation-hash'),
    } as unknown as TokenGenerator;
    const service = new EmailVerificationService(
      store,
      tokenGenerator,
      {} as EmailSender,
    );

    await expect(service.confirm('confirmation-token')).resolves.toEqual({
      status: 'CONFIRMED',
      session: {
        accessToken: 'session-token',
        expiresAt: '2026-08-18T12:00:00.000Z',
        user,
      },
    });
  });

  it('does not issue another session for an already confirmed token', async () => {
    const store = {
      confirmEmail: jest
        .fn()
        .mockResolvedValue({ status: 'already_confirmed' }),
    } as unknown as AuthStore;
    const tokenGenerator = {
      generate: jest.fn().mockReturnValue({
        raw: 'unused-session-token',
        hash: 'unused-session-hash',
        expiresAt: new Date('2026-08-18T12:00:00Z'),
      }),
      hash: jest.fn().mockReturnValue('confirmation-hash'),
    } as unknown as TokenGenerator;
    const service = new EmailVerificationService(
      store,
      tokenGenerator,
      {} as EmailSender,
    );

    await expect(service.confirm('confirmation-token')).resolves.toEqual({
      status: 'ALREADY_CONFIRMED',
    });
  });

  it('rejects a confirmation token that the store cannot consume', async () => {
    const confirmEmail = jest.fn().mockResolvedValue({ status: 'invalid' });
    const store = {
      confirmEmail,
    } as unknown as AuthStore;
    const tokenGenerator = {
      generate: jest.fn().mockReturnValue({
        raw: 'session-token',
        hash: 'session-hash',
        expiresAt: new Date('2026-08-18T12:00:00Z'),
      }),
      hash: jest.fn().mockReturnValue('token-hash'),
    } as unknown as TokenGenerator;
    const emailSender = {} as EmailSender;
    const service = new EmailVerificationService(
      store,
      tokenGenerator,
      emailSender,
    );

    await expect(service.confirm('raw-token')).rejects.toMatchObject<
      Partial<AuthError>
    >({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    expect(confirmEmail).toHaveBeenCalledTimes(1);
    const [input] = confirmEmail.mock.calls[0] as [ConfirmEmailInput];
    expect(input).toMatchObject({
      tokenHash: 'token-hash',
      sessionTokenHash: 'session-hash',
    });
    expect(input.sessionExpiresAt).toBeInstanceOf(Date);
    expect(input.now).toBeInstanceOf(Date);
  });

  it('does not reveal an unknown account while resending', async () => {
    const store = {
      replaceEmailConfirmationToken: jest.fn().mockResolvedValue(null),
    } as unknown as AuthStore;
    const tokenGenerator = {
      generate: jest.fn().mockReturnValue({
        raw: 'raw-token',
        hash: 'token-hash',
        expiresAt: new Date('2026-08-12T12:00:00Z'),
      }),
    } as unknown as TokenGenerator;
    const sendEmailConfirmation = jest.fn();
    const emailSender = { sendEmailConfirmation } as unknown as EmailSender;
    const service = new EmailVerificationService(
      store,
      tokenGenerator,
      emailSender,
    );

    await expect(
      service.resend('unknown@example.com'),
    ).resolves.toBeUndefined();
    expect(sendEmailConfirmation).not.toHaveBeenCalled();
  });
});
