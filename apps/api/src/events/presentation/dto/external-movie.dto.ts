import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class SearchMoviesQueryDto {
  @ApiProperty({ example: 'Interestelar', minLength: 2, maxLength: 100 })
  @IsString()
  @Length(2, 100)
  query!: string;
}

@ApiSchema({ name: 'ExternalMovie' })
export class ExternalMovieDto {
  @ApiProperty({ example: '157336' })
  externalId!: string;

  @ApiProperty({ example: 'Interestelar' })
  title!: string;

  @ApiProperty()
  summary!: string;

  @ApiPropertyOptional({ example: '2014-11-05', nullable: true })
  releaseDate!: string | null;

  @ApiPropertyOptional({
    example: 'https://image.tmdb.org/t/p/w500/poster.jpg',
    nullable: true,
  })
  imageUrl!: string | null;
}
