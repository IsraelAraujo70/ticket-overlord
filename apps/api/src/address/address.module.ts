import { Module } from '@nestjs/common';
import { AddressController } from './address.controller';
import { ADDRESS_PROVIDER } from './address-provider';
import { AddressService } from './address.service';
import { ViaCepAddressProvider } from './viacep-address-provider';

@Module({
  controllers: [AddressController],
  providers: [
    AddressService,
    { provide: ADDRESS_PROVIDER, useClass: ViaCepAddressProvider },
  ],
  exports: [AddressService],
})
export class AddressModule {}
