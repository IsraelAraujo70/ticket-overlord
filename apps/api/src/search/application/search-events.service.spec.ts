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
  suggestionResults: SearchSuggestion[] = [];

  searchLexical(query: SearchQuery): Promise<SearchEventPage> {
    this.lexicalCalls += 1;
    return Promise.resolve(page(query));
  }

  searchHybrid(query: SearchQuery): Promise<SearchEventPage> {
    this.hybridCalls += 1;
    return Promise.resolve(page(query));
  }

  suggest(): Promise<SearchSuggestion[]> {
    return Promise.resolve(this.suggestionResults);
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
  queryCalls = 0;

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
    this.queryCalls += 1;
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

  it('keeps indexed lexical suggestions ahead of semantic retrieval', async () => {
    const store = new FakeSearchStore();
    store.suggestionResults = [
      {
        kind: 'CATEGORY',
        label: 'Shows',
        value: 'Shows',
        slug: null,
      },
    ];
    const embeddings = new FakeEmbeddingProvider(true);
    const service = new SearchEventsService(
      store,
      embeddings,
      new FakeImages(),
    );

    await expect(service.suggestions('show', 8)).resolves.toEqual(
      store.suggestionResults,
    );
    expect(embeddings.queryCalls).toBe(0);
    expect(store.hybridCalls).toBe(0);
  });

  it('returns semantic event suggestions when lexical autocomplete is empty', async () => {
    const store = new FakeSearchStore();
    const embeddings = new FakeEmbeddingProvider(true);
    const service = new SearchEventsService(
      store,
      embeddings,
      new FakeImages(),
    );

    await expect(service.suggestions('quero ouvir musica', 8)).resolves.toEqual(
      [
        {
          kind: 'EVENT',
          label: 'Festival de Jazz',
          value: 'Festival de Jazz',
          slug: 'festival-jazz',
        },
      ],
    );
    expect(embeddings.queryCalls).toBe(1);
    expect(store.hybridCalls).toBe(1);
  });

  it('returns no API suggestions when semantic fallback is unavailable', async () => {
    const store = new FakeSearchStore();
    const service = new SearchEventsService(
      store,
      new FakeEmbeddingProvider(true, true),
      new FakeImages(),
    );

    await expect(service.suggestions('quero comida', 8)).resolves.toEqual([]);
    expect(store.hybridCalls).toBe(0);
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
