import { AuthError } from '../domain/auth.errors';
import { EmailVerificationService } from './email-verification.service';
import { AuthStore } from './ports/auth-store';
import type { EmailSender } from './ports/email-sender';
import { TokenGenerator } from './ports/token-generator';

describe('EmailVerificationService', () => {
  it('rejects a confirmation token that the store cannot consume', async () => {
    const confirmEmail = jest.fn().mockResolvedValue(false);
    const store = {
      confirmEmail,
    } as unknown as AuthStore;
    const tokenGenerator = {
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
    expect(confirmEmail).toHaveBeenCalledWith('token-hash', expect.any(Date));
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
