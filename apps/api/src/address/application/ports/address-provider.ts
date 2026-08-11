import type { AddressLookupResult } from '../../domain/address';

export abstract class AddressProvider {
  abstract lookup(postalCode: string): Promise<AddressLookupResult | null>;
}
