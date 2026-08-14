import type {
  EventRecord,
  PresentedEvent,
} from '../../events/domain/event.types';

export type SearchSuggestionKind = 'EVENT' | 'CATEGORY' | 'CITY' | 'VENUE';

export interface SearchSuggestion {
  kind: SearchSuggestionKind;
  label: string;
  value: string;
  slug: string | null;
}

export interface SearchQuery {
  query: string;
  page: number;
  pageSize: number;
}

export interface SearchEventPage {
  items: EventRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PresentedSearchEventPage extends Omit<
  SearchEventPage,
  'items'
> {
  items: PresentedEvent[];
}

export interface SearchIndexCandidate {
  event: EventRecord;
  indexedContentHash: string | null;
  indexedModel: string | null;
}
