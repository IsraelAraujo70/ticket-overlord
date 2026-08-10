import { AddressLookupError, type AddressLookupResult } from './address.types';
import type { AddressProvider } from './address-provider';

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

export class ViaCepAddressProvider implements AddressProvider {
  async lookup(postalCode: string): Promise<AddressLookupResult | null> {
    let response: Response;

    try {
      response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, {
        signal: AbortSignal.timeout(3_000),
        headers: { Accept: 'application/json' },
      });
    } catch {
      throw new AddressLookupError(
        'ADDRESS_PROVIDER_UNAVAILABLE',
        'O serviço de CEP está indisponível. Tente novamente.',
      );
    }

    if (!response.ok) {
      throw new AddressLookupError(
        'ADDRESS_PROVIDER_UNAVAILABLE',
        'O serviço de CEP está indisponível. Tente novamente.',
      );
    }

    let body: ViaCepResponse;

    try {
      body = (await response.json()) as ViaCepResponse;
    } catch {
      throw new AddressLookupError(
        'ADDRESS_PROVIDER_UNAVAILABLE',
        'O serviço de CEP retornou uma resposta inválida.',
      );
    }

    if (body.erro === true || body.erro === 'true') {
      return null;
    }

    if (!body.cep || !body.localidade || !body.uf) {
      throw new AddressLookupError(
        'ADDRESS_PROVIDER_UNAVAILABLE',
        'O serviço de CEP retornou uma resposta incompleta.',
      );
    }

    return {
      postalCode: body.cep.replace(/\D/g, ''),
      street: body.logradouro ?? '',
      neighborhood: body.bairro ?? '',
      city: body.localidade,
      state: body.uf,
    };
  }
}
