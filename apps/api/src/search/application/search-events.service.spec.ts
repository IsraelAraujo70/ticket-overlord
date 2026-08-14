import type { EventRecord } from '../../events/domain/event.types';
import { EventImageStorage } from '../../events/application/ports/event-image-storage';
import type {
  SearchEventPage,
  SearchIndexCandidate,
  SearchQuery,
  SearchSuggestion,
} from '../domain/search.types';
import { EmbeddingProvider } from './ports/embedding-provider';
import { PublishedEventSearch } from './ports/published-event-search';
import { SearchEventsService } from './search-events.service';

class FakeSearchStore extends PublishedEventSearch {
  lexicalCalls = 0;
  hybridCalls = 0;

  searchLexical(query: SearchQuery): Promise<SearchEventPage> {
    this.lexicalCalls += 1;
    return Promise.resolve(page(query));
  }

  searchHybrid(query: SearchQuery): Promise<SearchEventPage> {
    this.hybridCalls += 1;
    return Promise.resolve(page(query));
  }

  suggest(): Promise<SearchSuggestion[]> {
    return Promise.resolve([]);
  }

  listIndexCandidates(): Promise<SearchIndexCandidate[]> {
    return Promise.resolve([]);
  }

  upsertEmbeddings(): Promise<void> {
    return Promise.resolve();
  }
}

class FakeEmbeddingProvider extends EmbeddingProvider {
  readonly model = 'test-model';
  readonly dimensions = 3;

  constructor(
    private readonly configured: boolean,
    private readonly shouldFail = false,
  ) {
    super();
  }

  isConfigured(): boolean {
    return this.configured;
  }

  embedQuery(): Promise<readonly number[]> {
    return this.shouldFail
      ? Promise.reject(new Error('provider unavailable'))
      : Promise.resolve([1, 0, 0]);
  }

  embedDocuments(): Promise<readonly number[][]> {
    return Promise.resolve([]);
  }
}

class FakeImages extends EventImageStorage {
  store(): Promise<void> {
    return Promise.resolve();
  }
  delete(): Promise<void> {
    return Promise.resolve();
  }
  createReadUrl(key: string): Promise<string> {
    return Promise.resolve(`https://storage.test/${key}`);
  }
}

describe('SearchEventsService', () => {
  it('uses hybrid search when embeddings are available', async () => {
    const store = new FakeSearchStore();
    const service = new SearchEventsService(
      store,
      new FakeEmbeddingProvider(true),
      new FakeImages(),
    );

    const result = await service.search({
      query: '  jazz  ',
      page: 1,
      pageSize: 10,
    });
    expect(result.items[0]?.id).toBe('event-1');
    expect(result.items[0]?.coverUrl).toContain('cover');
    expect(store.hybridCalls).toBe(1);
    expect(store.lexicalCalls).toBe(0);
  });

  it('falls back to lexical search when the embedding provider fails', async () => {
    const store = new FakeSearchStore();
    const service = new SearchEventsService(
      store,
      new FakeEmbeddingProvider(true, true),
      new FakeImages(),
    );

    await expect(
      service.search({ query: 'festival', page: 1, pageSize: 10 }),
    ).resolves.toMatchObject({ total: 1 });
    expect(store.hybridCalls).toBe(0);
    expect(store.lexicalCalls).toBe(1);
  });
});

function page(query: SearchQuery): SearchEventPage {
  return {
    items: [event()],
    total: 1,
    page: query.page,
    pageSize: query.pageSize,
  };
}

function event(): EventRecord {
  return {
    id: 'event-1',
    organizationId: 'organization-1',
    externalSource: null,
    externalId: null,
    slug: 'festival-jazz',
    title: 'Festival de Jazz',
    summary: 'Música brasileira',
    category: 'Shows',
    sourceReleaseDate: null,
    sourceImageUrl: null,
    startsAt: new Date('2026-09-01T20:00:00.000Z'),
    venue: 'Auditório',
    city: 'São Paulo',
    capacity: 100,
    priceInCents: 5000,
    currency: 'BRL',
    coverObjectKey: 'events/cover.webp',
    coverContentType: 'image/webp',
    status: 'PUBLISHED',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };
}
