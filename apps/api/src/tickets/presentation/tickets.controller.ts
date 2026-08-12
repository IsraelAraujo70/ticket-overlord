import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedSession } from '../../auth/domain/auth.types';
import { AuthGuard } from '../../auth/presentation/auth.guard';
import { CurrentAuth } from '../../auth/presentation/current-auth.decorator';
import { TicketQueryService } from '../application/ticket-query.service';
import { TicketDto } from './dto/ticket.dto';
import { TicketExceptionFilter } from './ticket-exception.filter';

@ApiTags('Tickets')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard)
@UseFilters(TicketExceptionFilter)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketQueryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ingressos do cliente autenticado' })
  @ApiOkResponse({ type: TicketDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem papel de cliente.' })
  list(@CurrentAuth() auth: AuthenticatedSession): Promise<TicketDto[]> {
    return this.tickets.list(auth.user);
  }

  @Get(':ticketId')
  @ApiOperation({ summary: 'Obter um ingresso do cliente autenticado' })
  @ApiOkResponse({ type: TicketDto })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem papel de cliente.' })
  @ApiNotFoundResponse({
    description: 'Ingresso não encontrado ou não pertence ao cliente.',
  })
  find(
    @CurrentAuth() auth: AuthenticatedSession,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
  ): Promise<TicketDto> {
    return this.tickets.find(auth.user, ticketId);
  }
}
