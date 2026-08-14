import type {
  SearchEventPage,
  SearchIndexCandidate,
  SearchQuery,
  SearchSuggestion,
} from '../../domain/search.types';

export abstract class PublishedEventSearch {
  abstract searchLexical(query: SearchQuery): Promise<SearchEventPage>;
  abstract searchHybrid(
    query: SearchQuery,
    embedding: readonly number[],
  ): Promise<SearchEventPage>;
  abstract suggest(query: string, limit: number): Promise<SearchSuggestion[]>;
  abstract listIndexCandidates(
    afterEventId: string | null,
    limit: number,
  ): Promise<SearchIndexCandidate[]>;
  abstract upsertEmbeddings(
    entries: readonly {
      eventId: string;
      contentHash: string;
      model: string;
      embedding: readonly number[];
    }[],
  ): Promise<void>;
}
