import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddressResponseDto } from './address-response.dto';
import { AddressService } from './address.service';
import { AddressLookupError } from './address.types';

function mapAddressError(error: unknown): never {
  if (!(error instanceof AddressLookupError)) {
    throw error;
  }

  const body = { code: error.code, message: error.message };

  if (error.code === 'INVALID_POSTAL_CODE') {
    throw new BadRequestException(body);
  }

  if (error.code === 'POSTAL_CODE_NOT_FOUND') {
    throw new NotFoundException(body);
  }

  throw new ServiceUnavailableException(body);
}

@ApiTags('Addresses')
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get('cep/:cep')
  @ApiOperation({ summary: 'Consultar endereço brasileiro pelo CEP' })
  @ApiOkResponse({ type: AddressResponseDto })
  @ApiBadRequestResponse({ description: 'CEP com formato inválido.' })
  @ApiNotFoundResponse({ description: 'CEP não encontrado.' })
  @ApiServiceUnavailableResponse({ description: 'ViaCEP indisponível.' })
  async lookup(@Param('cep') postalCode: string): Promise<AddressResponseDto> {
    try {
      return await this.addressService.lookup(postalCode);
    } catch (error) {
      mapAddressError(error);
    }
  }
}
