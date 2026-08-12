import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import type { AuthenticatedSession } from '../../auth/domain/auth.types';
import { AuthGuard } from '../../auth/presentation/auth.guard';
import { CurrentAuth } from '../../auth/presentation/current-auth.decorator';
import { PaymentService } from '../application/payment.service';
import { ReservationService } from '../application/reservation.service';
import { CheckoutExceptionFilter } from './checkout-exception.filter';
import {
  CreateReservationDto,
  PaymentResultDto,
  ProcessPaymentDto,
  ReservationDetailDto,
  ReservationDto,
  paymentResultDto,
  reservationDto,
} from './dto/checkout.dto';

@ApiTags('Checkout')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard)
@UseFilters(CheckoutExceptionFilter)
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservations: ReservationService,
    private readonly payments: PaymentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar reserva de ingressos' })
  @ApiCreatedResponse({ type: ReservationDto })
  @ApiBadRequestResponse({ description: 'Evento ou quantidade inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem papel de cliente.' })
  @ApiNotFoundResponse({ description: 'Evento não disponível para venda.' })
  @ApiConflictResponse({ description: 'Inventário insuficiente.' })
  async create(
    @CurrentAuth() auth: AuthenticatedSession,
    @Body() dto: CreateReservationDto,
  ): Promise<ReservationDto> {
    return reservationDto(
      await this.reservations.create(auth.user, dto.eventId, dto.quantity),
    );
  }

  @Get(':reservationId')
  @ApiOperation({ summary: 'Obter checkout da própria reserva' })
  @ApiOkResponse({ type: ReservationDetailDto })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem papel de cliente.' })
  @ApiNotFoundResponse({ description: 'Reserva não encontrada.' })
  find(
    @CurrentAuth() auth: AuthenticatedSession,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ): Promise<ReservationDetailDto> {
    return this.reservations.find(auth.user, reservationId);
  }

  @Post(':reservationId/payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Processar pagamento simulado idempotente' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({ type: PaymentResultDto })
  @ApiBadRequestResponse({ description: 'Header ou intenção inválidos.' })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Conta sem papel de cliente.' })
  @ApiNotFoundResponse({ description: 'Reserva não encontrada.' })
  @ApiConflictResponse({
    description: 'Reserva expirada, terminal ou chave reutilizada.',
  })
  async payment(
    @CurrentAuth() auth: AuthenticatedSession,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: ProcessPaymentDto,
  ): Promise<PaymentResultDto> {
    if (!idempotencyKey || !isUUID(idempotencyKey)) {
      throw new BadRequestException({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Idempotency-Key deve ser um UUID válido.',
      });
    }

    return paymentResultDto(
      await this.payments.process(
        auth.user,
        reservationId,
        idempotencyKey,
        dto.outcome,
      ),
    );
  }
}
