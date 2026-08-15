import { Injectable } from '@nestjs/common';
import { presentEvent } from '../../events/application/event-presenter';
import { EventImageStorage } from '../../events/application/ports/event-image-storage';
import type {
  PresentedSearchEventPage,
  SearchSuggestion,
} from './models/search.models';
import { EmbeddingProvider } from './ports/embedding-provider';
import { PublishedEventSearchReader } from './ports/published-event-search';

@Injectable()
export class SearchEventsService {
  constructor(
    private readonly searchStore: PublishedEventSearchReader,
    private readonly embeddings: EmbeddingProvider,
    private readonly images: EventImageStorage,
  ) {}

  async search(input: {
    query: string;
    page: number;
    pageSize: number;
  }): Promise<PresentedSearchEventPage> {
    const query = normalizeQuery(input.query);
    let page;

    if (this.embeddings.isConfigured()) {
      try {
        const embedding = await this.embeddings.embedQuery(query);
        page = await this.searchStore.searchHybrid(
          { ...input, query },
          embedding,
        );
      } catch {
        page = await this.searchStore.searchLexical({ ...input, query });
      }
    } else {
      page = await this.searchStore.searchLexical({ ...input, query });
    }

    return {
      ...page,
      items: await Promise.all(
        page.items.map((event) => presentEvent(event, this.images)),
      ),
    };
  }

  async suggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const normalized = normalizeQuery(query);
    const lexical = await this.searchStore.suggest(normalized, limit);
    if (
      lexical.length > 0 ||
      normalized.length < 4 ||
      !this.embeddings.isConfigured()
    ) {
      return lexical;
    }

    try {
      const embedding = await this.embeddings.embedQuery(normalized);
      const semantic = await this.searchStore.searchHybrid(
        { query: normalized, page: 1, pageSize: Math.min(limit, 4) },
        embedding,
      );
      return semantic.items.map((event) => ({
        kind: 'EVENT',
        label: event.title,
        value: event.title,
        slug: event.slug,
      }));
    } catch {
      return lexical;
    }
  }
}

function normalizeQuery(value: string): string {
  return value.trim().normalize('NFC').slice(0, 100);
}
