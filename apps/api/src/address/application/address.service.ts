import { Injectable } from '@nestjs/common';
import {
  AddressLookupError,
  type AddressLookupResult,
} from '../domain/address';
import { AddressProvider } from './ports/address-provider';

@Injectable()
export class AddressService {
  constructor(private readonly provider: AddressProvider) {}

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
