export type AuthErrorCode =
  | 'EMAIL_ALREADY_REGISTERED'
  | 'CNPJ_ALREADY_REGISTERED'
  | 'INVALID_CNPJ'
  | 'INVALID_PHONE'
  | 'INVALID_POSTAL_CODE'
  | 'INVALID_STATE'
  | 'ORGANIZATION_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_OR_EXPIRED_TOKEN';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
  }
}
