import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TicketQueryService } from '../application/ticket-query.service';
import { SharedTicketDto } from './dto/ticket.dto';
import { TicketExceptionFilter } from './ticket-exception.filter';

@ApiTags('Tickets')
@UseFilters(TicketExceptionFilter)
@Controller('shared-tickets')
export class SharedTicketsController {
  constructor(private readonly tickets: TicketQueryService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Visualizar ingresso por link secreto' })
  @ApiOkResponse({ type: SharedTicketDto })
  @ApiNotFoundResponse({ description: 'Link de ingresso inválido.' })
  shared(@Param('token') token: string): Promise<SharedTicketDto> {
    return this.tickets.shared(token);
  }
}
