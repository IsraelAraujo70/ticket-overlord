import { isStrongPassword } from './password';

describe('strong password validation', () => {
  it.each([
    ['is too short', 'Short1!'],
    ['has no uppercase letter', 'lowercase2026!'],
    ['has no lowercase letter', 'UPPERCASE2026!'],
    ['has no number', 'StrongPassword!'],
    ['has no symbol', 'StrongPassword2026'],
    ['uses whitespace instead of a symbol', 'Strong Password2026'],
  ])('rejects a password that %s', (_reason, password) => {
    expect(isStrongPassword(password)).toBe(false);
  });

  it('accepts a password that meets every requirement', () => {
    expect(isStrongPassword('StrongPassword2026!')).toBe(true);
  });
});
