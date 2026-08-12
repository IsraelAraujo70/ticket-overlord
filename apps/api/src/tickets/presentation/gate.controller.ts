import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedSession } from '../../auth/domain/auth.types';
import { AuthGuard } from '../../auth/presentation/auth.guard';
import { CurrentAuth } from '../../auth/presentation/current-auth.decorator';
import { GateService } from '../application/gate.service';
import {
  GateEventDto,
  GateValidationDto,
  ValidateTicketDto,
} from './dto/ticket.dto';
import { TicketExceptionFilter } from './ticket-exception.filter';

@ApiTags('Gate')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard)
@UseFilters(TicketExceptionFilter)
@Controller('gate')
export class GateController {
  constructor(private readonly gate: GateService) {}

  @Get('events')
  @ApiOperation({ summary: 'Listar eventos disponíveis para a portaria' })
  @ApiOkResponse({ type: GateEventDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({
    description: 'Conta fora da equipe de uma organização.',
  })
  events(@CurrentAuth() auth: AuthenticatedSession): Promise<GateEventDto[]> {
    return this.gate.events(auth.user);
  }

  @Post('events/:eventId/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar e consumir um ingresso atomicamente' })
  @ApiOkResponse({ type: GateValidationDto })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({
    description: 'Conta fora da equipe de uma organização.',
  })
  async validate(
    @CurrentAuth() auth: AuthenticatedSession,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: ValidateTicketDto,
  ): Promise<GateValidationDto> {
    return { result: await this.gate.validate(auth.user, eventId, dto.code) };
  }
}
