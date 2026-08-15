import type {
  SearchEventPage,
  SearchIndexCandidate,
  SearchQuery,
  SearchSuggestion,
} from '../models/search.models';

export abstract class PublishedEventSearchReader {
  abstract searchLexical(query: SearchQuery): Promise<SearchEventPage>;
  abstract searchHybrid(
    query: SearchQuery,
    embedding: readonly number[],
  ): Promise<SearchEventPage>;
  abstract suggest(query: string, limit: number): Promise<SearchSuggestion[]>;
}

export abstract class SearchEmbeddingIndexStore {
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
