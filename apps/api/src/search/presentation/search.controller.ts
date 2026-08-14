import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchEventsService } from '../application/search-events.service';
import {
  SearchEventPageDto,
  SearchQueryDto,
  SearchSuggestionDto,
  SearchSuggestionsQueryDto,
} from './dto/search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchEvents: SearchEventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Buscar eventos publicados',
    description:
      'Combina busca textual indexada e busca semântica quando embeddings estão configurados. A busca textual permanece como fallback.',
  })
  @ApiOkResponse({ type: SearchEventPageDto })
  search(@Query() query: SearchQueryDto): Promise<SearchEventPageDto> {
    return this.searchEvents.search({
      query: query.q,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Sugerir eventos, categorias, cidades e locais',
    description:
      'Prioriza autocomplete lexical indexado e usa eventos semanticamente próximos quando não há correspondência textual.',
  })
  @ApiOkResponse({ type: SearchSuggestionDto, isArray: true })
  suggestions(
    @Query() query: SearchSuggestionsQueryDto,
  ): Promise<SearchSuggestionDto[]> {
    return this.searchEvents.suggestions(query.q, query.limit);
  }
}
