import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { GateService } from './application/gate.service';
import { TicketStore } from './application/ports/ticket-store';
import { TicketQueryService } from './application/ticket-query.service';
import { PostgresTicketStore } from './infrastructure/persistence/postgres-ticket-store';
import { GateController } from './presentation/gate.controller';
import { SharedTicketsController } from './presentation/shared-tickets.controller';
import { TicketExceptionFilter } from './presentation/ticket-exception.filter';
import { TicketsController } from './presentation/tickets.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [TicketsController, SharedTicketsController, GateController],
  providers: [
    TicketQueryService,
    GateService,
    TicketExceptionFilter,
    { provide: TicketStore, useClass: PostgresTicketStore },
  ],
  exports: [TicketStore],
})
export class TicketsModule {}
