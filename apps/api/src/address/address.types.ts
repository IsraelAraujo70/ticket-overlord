export interface AddressLookupResult {
  postalCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export type AddressLookupErrorCode =
  | 'INVALID_POSTAL_CODE'
  | 'POSTAL_CODE_NOT_FOUND'
  | 'ADDRESS_PROVIDER_UNAVAILABLE';

export class AddressLookupError extends Error {
  constructor(
    readonly code: AddressLookupErrorCode,
    message: string,
  ) {
    super(message);
  }
}
