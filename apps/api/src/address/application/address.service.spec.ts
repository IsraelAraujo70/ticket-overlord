import { AddressLookupError } from '../domain/address';
import { AddressService } from './address.service';
import { AddressProvider } from './ports/address-provider';

describe('AddressService', () => {
  it('normalizes a CEP before consulting the provider', async () => {
    const lookup = jest.fn().mockResolvedValue({
      postalCode: '01001000',
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    });
    const provider = { lookup } as AddressProvider;
    const service = new AddressService(provider);

    await expect(service.lookup('01001-000')).resolves.toMatchObject({
      city: 'São Paulo',
    });
    expect(lookup).toHaveBeenCalledWith('01001000');
  });

  it('does not call the provider for an invalid CEP', async () => {
    const lookup = jest.fn();
    const provider = { lookup } as AddressProvider;
    const service = new AddressService(provider);

    await expect(service.lookup('123')).rejects.toMatchObject<
      Partial<AddressLookupError>
    >({
      code: 'INVALID_POSTAL_CODE',
    });
    expect(lookup).not.toHaveBeenCalled();
  });
});
