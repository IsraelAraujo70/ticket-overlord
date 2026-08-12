import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type {
  GateEventView,
  GateValidationResult,
  SharedTicketView,
  TicketView,
} from '../../domain/ticket.types';

@ApiSchema({ name: 'TicketEvent' })
export class TicketEventDto {
  @ApiProperty() title!: string;
  @ApiProperty({ format: 'date-time' }) startsAt!: Date;
  @ApiProperty() venue!: string;
  @ApiProperty() city!: string;
}

@ApiSchema({ name: 'Ticket' })
export class TicketDto implements TicketView {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) reservationId!: string;
  @ApiProperty({ format: 'uuid' }) eventId!: string;
  @ApiProperty({ minimum: 1 }) sequence!: number;
  @ApiProperty() manualCode!: string;
  @ApiProperty({
    description: 'Canonical signed value encoded in the QR image.',
  })
  qrCode!: string;
  @ApiProperty({ description: 'Secret used to build the public sharing URL.' })
  shareToken!: string;
  @ApiProperty({ enum: ['VALID', 'USED'] }) status!: 'VALID' | 'USED';
  @ApiProperty({ format: 'date-time', nullable: true }) usedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: TicketEventDto }) event!: TicketEventDto;
}

@ApiSchema({ name: 'SharedTicket' })
export class SharedTicketDto implements SharedTicketView {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) reservationId!: string;
  @ApiProperty({ format: 'uuid' }) eventId!: string;
  @ApiProperty({ minimum: 1 }) sequence!: number;
  @ApiProperty() manualCode!: string;
  @ApiProperty() qrCode!: string;
  @ApiProperty({ enum: ['VALID', 'USED'] }) status!: 'VALID' | 'USED';
  @ApiProperty({ format: 'date-time', nullable: true }) usedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: TicketEventDto }) event!: TicketEventDto;
  @ApiProperty() customerName!: string;
}

@ApiSchema({ name: 'GateEvent' })
export class GateEventDto implements GateEventView {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ format: 'date-time' }) startsAt!: Date;
  @ApiProperty() venue!: string;
  @ApiProperty() city!: string;
}

export class ValidateTicketDto {
  @ApiProperty({ description: 'Signed QR value or manual ticket code.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  code!: string;
}

@ApiSchema({ name: 'GateValidation' })
export class GateValidationDto {
  @ApiProperty({
    enum: [
      'VALID',
      'INVALID',
      'ALREADY_USED',
      'WRONG_EVENT',
      'OUTSIDE_ADMISSION_WINDOW',
    ],
  })
  result!: GateValidationResult;
}
