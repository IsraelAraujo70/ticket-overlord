import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ example: '157336' })
  @IsString()
  @Matches(/^\d+$/)
  externalId!: string;

  @ApiProperty({ example: '2026-09-05T22:00:00.000Z' })
  @IsISO8601({ strict: true })
  startsAt!: string;

  @ApiProperty({ example: 'Cine Belas Artes' })
  @IsString()
  @Length(2, 180)
  venue!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @Length(2, 120)
  city!: string;

  @ApiProperty({ example: 150, minimum: 1, maximum: 1000000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  capacity!: number;

  @ApiProperty({ example: 4500, minimum: 1, maximum: 100000000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100_000_000)
  priceInCents!: number;
}

@ApiSchema({ name: 'Event' })
export class EventDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ enum: ['TMDB'] })
  externalSource!: 'TMDB';

  @ApiProperty({ example: '157336' })
  externalId!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ example: 'Cinema' })
  category!: string;

  @ApiPropertyOptional({ example: '2014-11-05', nullable: true })
  sourceReleaseDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sourceImageUrl!: string | null;

  @ApiProperty({ format: 'date-time' })
  startsAt!: Date;

  @ApiProperty()
  venue!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  capacity!: number;

  @ApiProperty()
  priceInCents!: number;

  @ApiProperty({ enum: ['BRL'] })
  currency!: 'BRL';

  @ApiProperty()
  coverContentType!: string;

  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED'] })
  status!: 'DRAFT' | 'PUBLISHED';

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ format: 'uri' })
  coverUrl!: string;
}

@ApiSchema({ name: 'EventCoverUrl' })
export class EventCoverUrlDto {
  @ApiProperty({ format: 'uri' })
  url!: string;
}
