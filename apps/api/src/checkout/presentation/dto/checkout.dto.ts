import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsInt, IsUUID, Max, Min } from 'class-validator';
import type {
  PaymentResult,
  ReservationRecord,
} from '../../domain/checkout.types';

export class CreateReservationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  eventId!: string;

  @ApiProperty({ minimum: 1, maximum: 10, example: 2 })
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;
}

export class ProcessPaymentDto {
  @ApiProperty({ enum: ['APPROVED', 'REFUSED'] })
  @IsEnum(['APPROVED', 'REFUSED'])
  outcome!: 'APPROVED' | 'REFUSED';
}

@ApiSchema({ name: 'Reservation' })
export class ReservationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty({ minimum: 1, maximum: 10 })
  quantity!: number;

  @ApiProperty({ minimum: 1 })
  unitPriceInCents!: number;

  @ApiProperty({ minimum: 1 })
  totalInCents!: number;

  @ApiProperty({ enum: ['BRL'] })
  currency!: 'BRL';

  @ApiProperty({
    enum: ['PENDING_PAYMENT', 'PAID', 'PAYMENT_REFUSED', 'EXPIRED'],
  })
  status!: 'PENDING_PAYMENT' | 'PAID' | 'PAYMENT_REFUSED' | 'EXPIRED';

  @ApiProperty({ format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

@ApiSchema({ name: 'ReservationEventSummary' })
export class ReservationEventSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ format: 'date-time' })
  startsAt!: Date;

  @ApiProperty()
  venue!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty({ format: 'uri' })
  coverUrl!: string;
}

@ApiSchema({ name: 'ReservationDetail' })
export class ReservationDetailDto extends ReservationDto {
  @ApiProperty({ type: ReservationEventSummaryDto })
  event!: ReservationEventSummaryDto;
}

@ApiSchema({ name: 'Payment' })
export class PaymentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  reservationId!: string;

  @ApiProperty({ minimum: 1 })
  amountInCents!: number;

  @ApiProperty({ enum: ['BRL'] })
  currency!: 'BRL';

  @ApiProperty({ enum: ['APPROVED', 'REFUSED'] })
  status!: 'APPROVED' | 'REFUSED';

  @ApiProperty({ format: 'uuid' })
  idempotencyKey!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  processedAt!: Date;
}

@ApiSchema({ name: 'PaymentResult' })
export class PaymentResultDto {
  @ApiProperty({ type: PaymentDto })
  payment!: PaymentDto;

  @ApiProperty({ type: ReservationDto })
  reservation!: ReservationDto;
}

@ApiSchema({ name: 'PublishedEventDetail' })
export class PublishedEventDetailDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  category!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceReleaseDate!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uri' })
  sourceImageUrl!: string | null;

  @ApiProperty({ format: 'date-time' })
  startsAt!: Date;

  @ApiProperty()
  venue!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty({ minimum: 1 })
  capacity!: number;

  @ApiProperty({ minimum: 1 })
  priceInCents!: number;

  @ApiProperty({ enum: ['BRL'] })
  currency!: 'BRL';

  @ApiProperty()
  coverContentType!: string;

  @ApiProperty({ format: 'uri' })
  coverUrl!: string;

  @ApiProperty({ minimum: 0 })
  availableQuantity!: number;

  @ApiProperty({ minimum: 1, maximum: 10 })
  maxQuantityPerReservation!: number;

  @ApiProperty({
    description: 'Indica se o evento ainda aceita novas reservas.',
  })
  isPurchasable!: boolean;
}

export function reservationDto(row: ReservationRecord): ReservationDto {
  return {
    id: row.id,
    eventId: row.eventId,
    quantity: row.quantity,
    unitPriceInCents: row.unitPriceInCents,
    totalInCents: row.totalInCents,
    currency: row.currency,
    status: row.status,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function paymentResultDto(result: PaymentResult): PaymentResultDto {
  return {
    payment: {
      id: result.payment.id,
      reservationId: result.payment.reservationId,
      amountInCents: result.payment.amountInCents,
      currency: result.payment.currency,
      status: result.payment.status,
      idempotencyKey: result.payment.idempotencyKey,
      createdAt: result.payment.createdAt,
      processedAt: result.payment.processedAt,
    },
    reservation: reservationDto(result.reservation),
  };
}
