import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
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
import { ReportingService } from '../application/reporting.service';
import {
  ReportEventListQueryDto,
  ReportEventPageDto,
  ReportOverviewDto,
  ReportingPeriodQueryDto,
} from './dto/reporting.dto';
import { ReportingExceptionFilter } from './reporting-exception.filter';

@ApiTags('Reporting')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard)
@UseFilters(ReportingExceptionFilter)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Resumir vendas e entradas da administração',
    description:
      'Organizadores recebem somente dados da própria organização. Administradores recebem a visão global somente leitura.',
  })
  @ApiOkResponse({ type: ReportOverviewDto })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem acesso aos relatórios.' })
  overview(
    @CurrentAuth() auth: AuthenticatedSession,
    @Query() query: ReportingPeriodQueryDto,
  ): Promise<ReportOverviewDto> {
    return this.reporting.overview(auth.user, query.period);
  }

  @Get('events')
  @ApiOperation({
    summary: 'Listar desempenho de ingressos por evento',
    description:
      'O período limita compras, ingressos vendidos, receita e check-ins. Ocupação e disponibilidade consideram todo o histórico.',
  })
  @ApiOkResponse({ type: ReportEventPageDto })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem acesso aos relatórios.' })
  events(
    @CurrentAuth() auth: AuthenticatedSession,
    @Query() query: ReportEventListQueryDto,
  ): Promise<ReportEventPageDto> {
    return this.reporting.events(auth.user, query.period, query);
  }
}
