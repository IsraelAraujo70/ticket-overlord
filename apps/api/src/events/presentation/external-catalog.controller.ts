import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedSession } from '../../auth/domain/auth.types';
import { AuthGuard } from '../../auth/presentation/auth.guard';
import { CurrentAuth } from '../../auth/presentation/current-auth.decorator';
import { SearchExternalMoviesService } from '../application/search-external-movies.service';
import { EventExceptionFilter } from './event-exception.filter';
import {
  ExternalMovieDto,
  SearchMoviesQueryDto,
} from './dto/external-movie.dto';

@ApiTags('External catalog')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard)
@UseFilters(EventExceptionFilter)
@Controller('external-catalog')
export class ExternalCatalogController {
  constructor(private readonly searchMovies: SearchExternalMoviesService) {}

  @Get('movies')
  @ApiOperation({ summary: 'Buscar filmes no catálogo do TMDb' })
  @ApiOkResponse({ type: ExternalMovieDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida.' })
  @ApiServiceUnavailableResponse({
    description: 'TMDb indisponível ou sem configuração.',
  })
  search(
    @CurrentAuth() auth: AuthenticatedSession,
    @Query() query: SearchMoviesQueryDto,
  ): Promise<ExternalMovieDto[]> {
    return this.searchMovies.search(auth.user, query.query);
  }
}
