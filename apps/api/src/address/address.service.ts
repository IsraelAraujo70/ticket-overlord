import { Inject, Injectable } from '@nestjs/common';
import { ADDRESS_PROVIDER, type AddressProvider } from './address-provider';
import { AddressLookupError, type AddressLookupResult } from './address.types';

@Injectable()
export class AddressService {
  constructor(
    @Inject(ADDRESS_PROVIDER) private readonly provider: AddressProvider,
  ) {}

  async lookup(rawPostalCode: string): Promise<AddressLookupResult> {
    const postalCode = rawPostalCode.replace(/\D/g, '');

    if (!/^\d{8}$/.test(postalCode)) {
      throw new AddressLookupError(
        'INVALID_POSTAL_CODE',
        'O CEP deve conter oito dígitos.',
      );
    }

    const result = await this.provider.lookup(postalCode);

    if (!result) {
      throw new AddressLookupError(
        'POSTAL_CODE_NOT_FOUND',
        'CEP não encontrado.',
      );
    }

    return result;
  }
}
