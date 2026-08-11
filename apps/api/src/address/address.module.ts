import { Module } from '@nestjs/common';
import { AddressService } from './application/address.service';
import { AddressProvider } from './application/ports/address-provider';
import { ViaCepAddressProvider } from './infrastructure/viacep-address-provider';
import { AddressController } from './presentation/address.controller';
import { AddressExceptionFilter } from './presentation/address-exception.filter';

@Module({
  controllers: [AddressController],
  providers: [
    AddressService,
    AddressExceptionFilter,
    { provide: AddressProvider, useClass: ViaCepAddressProvider },
  ],
  exports: [AddressService],
})
export class AddressModule {}
