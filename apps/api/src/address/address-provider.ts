import type { AddressLookupResult } from './address.types';

export const ADDRESS_PROVIDER = Symbol('ADDRESS_PROVIDER');

export interface AddressProvider {
  lookup(postalCode: string): Promise<AddressLookupResult | null>;
}
