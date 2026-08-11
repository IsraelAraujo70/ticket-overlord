import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddressService } from '../application/address.service';
import { AddressExceptionFilter } from './address-exception.filter';
import { AddressResponseDto } from './address-response.dto';

@ApiTags('Addresses')
@UseFilters(AddressExceptionFilter)
@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get('cep/:cep')
  @ApiOperation({ summary: 'Consultar endereço brasileiro pelo CEP' })
  @ApiOkResponse({ type: AddressResponseDto })
  @ApiBadRequestResponse({ description: 'CEP com formato inválido.' })
  @ApiNotFoundResponse({ description: 'CEP não encontrado.' })
  @ApiServiceUnavailableResponse({ description: 'ViaCEP indisponível.' })
  lookup(@Param('cep') postalCode: string): Promise<AddressResponseDto> {
    return this.addressService.lookup(postalCode);
  }
}
