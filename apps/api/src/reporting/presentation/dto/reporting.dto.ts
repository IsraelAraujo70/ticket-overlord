import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { REPORTING_PERIODS } from '../../domain/reporting.types';
import type { ReportingPeriod } from '../../domain/reporting.types';

export class ReportingPeriodQueryDto {
  @ApiPropertyOptional({ enum: REPORTING_PERIODS, default: '30d' })
  @IsEnum(REPORTING_PERIODS)
  period: ReportingPeriod = '30d';
}

export class ReportEventListQueryDto extends ReportingPeriodQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({ minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  search?: string;
}

@ApiSchema({ name: 'ReportTotals' })
export class ReportTotalsDto {
  @ApiProperty({ minimum: 0 })
  purchases!: number;

  @ApiProperty({ minimum: 0 })
  ticketsSold!: number;

  @ApiProperty({ minimum: 0 })
  grossRevenueInCents!: number;

  @ApiProperty({ minimum: 0 })
  checkIns!: number;
}

@ApiSchema({ name: 'ReportEvent' })
export class ReportEventDto extends ReportTotalsDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  organizationName!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ format: 'date-time' })
  startsAt!: Date;

  @ApiProperty()
  venue!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty({ minimum: 1 })
  capacity!: number;

  @ApiProperty({ minimum: 0 })
  ticketsSoldAllTime!: number;

  @ApiProperty({ minimum: 0 })
  checkInsAllTime!: number;

  @ApiProperty({ minimum: 0 })
  availableQuantity!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  occupancyPercentage!: number;
}

@ApiSchema({ name: 'ReportOverview' })
export class ReportOverviewDto {
  @ApiProperty({ enum: ['ORGANIZATION', 'GLOBAL'] })
  scope!: 'ORGANIZATION' | 'GLOBAL';

  @ApiProperty({ enum: REPORTING_PERIODS })
  period!: ReportingPeriod;

  @ApiProperty({ type: ReportTotalsDto })
  totals!: ReportTotalsDto;

  @ApiProperty({ type: ReportEventDto, isArray: true })
  upcomingEvents!: ReportEventDto[];
}

@ApiSchema({ name: 'ReportEventPage' })
export class ReportEventPageDto {
  @ApiProperty({ type: ReportEventDto, isArray: true })
  items!: ReportEventDto[];

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize!: number;
}
