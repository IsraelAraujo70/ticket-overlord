export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/;

export const STRONG_PASSWORD_MESSAGE =
  'A senha deve ter entre 12 e 128 caracteres, incluindo letra maiúscula, letra minúscula, número e símbolo diferente de espaço.';

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    password.length <= 128 &&
    STRONG_PASSWORD_PATTERN.test(password)
  );
}
