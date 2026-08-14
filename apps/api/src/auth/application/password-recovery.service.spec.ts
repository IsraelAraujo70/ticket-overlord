import { AuthError } from '../domain/auth.errors';
import { PasswordRecoveryService } from './password-recovery.service';
import { AuthStore, type ResetPasswordInput } from './ports/auth-store';
import type { EmailSender } from './ports/email-sender';
import { PasswordHasher } from './ports/password-hasher';
import { TokenGenerator } from './ports/token-generator';

describe('PasswordRecoveryService', () => {
  it('hashes the new password and delegates the atomic reset', async () => {
    const resetPasswordAndRevokeSessions = jest.fn().mockResolvedValue(true);
    const store = {
      hasValidPasswordResetToken: jest.fn().mockResolvedValue(true),
      resetPasswordAndRevokeSessions,
    } as unknown as AuthStore;
    const hash = jest.fn().mockResolvedValue('new-password-hash');
    const passwordHasher = { hash } as unknown as PasswordHasher;
    const tokenGenerator = {
      hash: jest.fn().mockReturnValue('reset-token-hash'),
    } as unknown as TokenGenerator;
    const service = new PasswordRecoveryService(
      store,
      passwordHasher,
      tokenGenerator,
      {} as EmailSender,
    );

    await expect(
      service.reset('raw-token', 'StrongPassword2026!'),
    ).resolves.toBeUndefined();
    expect(resetPasswordAndRevokeSessions).toHaveBeenCalledTimes(1);
    const [input] = resetPasswordAndRevokeSessions.mock.calls[0] as [
      ResetPasswordInput,
    ];
    expect(input).toMatchObject({
      tokenHash: 'reset-token-hash',
      passwordHash: 'new-password-hash',
    });
    expect(input.now).toBeInstanceOf(Date);
  });

  it('rejects a reset token that cannot be consumed', async () => {
    const store = {
      hasValidPasswordResetToken: jest.fn().mockResolvedValue(false),
      resetPasswordAndRevokeSessions: jest.fn().mockResolvedValue(false),
    } as unknown as AuthStore;
    const hash = jest.fn().mockResolvedValue('new-password-hash');
    const passwordHasher = { hash } as unknown as PasswordHasher;
    const tokenGenerator = {
      hash: jest.fn().mockReturnValue('reset-token-hash'),
    } as unknown as TokenGenerator;
    const service = new PasswordRecoveryService(
      store,
      passwordHasher,
      tokenGenerator,
      {} as EmailSender,
    );

    await expect(service.reset('raw-token', 'password')).rejects.toMatchObject<
      Partial<AuthError>
    >({ code: 'INVALID_OR_EXPIRED_TOKEN' });
    expect(hash).not.toHaveBeenCalled();
  });
});
