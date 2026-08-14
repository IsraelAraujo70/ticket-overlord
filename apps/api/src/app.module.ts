import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AddressModule } from './address/address.module';
import { AuthModule } from './auth/auth.module';
import { CheckoutModule } from './checkout/checkout.module';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { ReportingModule } from './reporting/reporting.module';
import { SearchModule } from './search/search.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['../../.env', '.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthModule,
    AddressModule,
    EventsModule,
    SearchModule,
    CheckoutModule,
    TicketsModule,
    ReportingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
