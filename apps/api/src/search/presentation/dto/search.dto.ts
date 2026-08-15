import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { EventPageDto } from '../../../events/presentation/dto/event.dto';
import type { SearchSuggestionKind } from '../../application/models/search.models';

export class SearchQueryDto {
  @ApiProperty({ minLength: 2, maxLength: 100, example: 'festival jazz' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  q!: string;

  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, default: 48, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 48;
}

export class SearchSuggestionsQueryDto {
  @ApiProperty({ minLength: 2, maxLength: 100, example: 'sao' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  q!: string;

  @ApiPropertyOptional({ type: Number, default: 8, minimum: 1, maximum: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 8;
}

@ApiSchema({ name: 'SearchSuggestion' })
export class SearchSuggestionDto {
  @ApiProperty({ enum: ['EVENT', 'CATEGORY', 'CITY', 'VENUE'] })
  kind!: SearchSuggestionKind;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiPropertyOptional({ nullable: true })
  slug!: string | null;
}

@ApiSchema({ name: 'SearchEventPage' })
export class SearchEventPageDto extends EventPageDto {}
