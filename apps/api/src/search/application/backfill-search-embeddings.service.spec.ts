import type { EventRecord } from '../../events/domain/event.types';
import type {
  SearchEventPage,
  SearchIndexCandidate,
  SearchSuggestion,
} from '../domain/search.types';
import { BackfillSearchEmbeddingsService } from './backfill-search-embeddings.service';
import { EmbeddingProvider } from './ports/embedding-provider';
import { PublishedEventSearch } from './ports/published-event-search';

class FakeEmbeddingProvider extends EmbeddingProvider {
  readonly model = 'test-model';
  readonly dimensions = 3;
  calls = 0;

  isConfigured(): boolean {
    return true;
  }
  embedQuery(): Promise<readonly number[]> {
    return Promise.resolve([1, 0, 0]);
  }
  embedDocuments(documents: readonly string[]): Promise<readonly number[][]> {
    this.calls += 1;
    return Promise.resolve(documents.map(() => [1, 0, 0]));
  }
}

class FakeSearchStore extends PublishedEventSearch {
  private indexedHash: string | null = null;
  private indexedModel: string | null = null;

  searchLexical(): Promise<SearchEventPage> {
    throw new Error('Not implemented for this test.');
  }
  searchHybrid(): Promise<SearchEventPage> {
    throw new Error('Not implemented for this test.');
  }
  suggest(): Promise<SearchSuggestion[]> {
    throw new Error('Not implemented for this test.');
  }
  listIndexCandidates(
    afterEventId: string | null,
  ): Promise<SearchIndexCandidate[]> {
    if (afterEventId) return Promise.resolve([]);
    return Promise.resolve([
      {
        event: event(),
        indexedContentHash: this.indexedHash,
        indexedModel: this.indexedModel,
      },
    ]);
  }
  upsertEmbeddings(
    entries: readonly { contentHash: string; model: string }[],
  ): Promise<void> {
    this.indexedHash = entries[0]?.contentHash ?? null;
    this.indexedModel = entries[0]?.model ?? null;
    return Promise.resolve();
  }
}

describe('BackfillSearchEmbeddingsService', () => {
  it('skips documents whose content hash and model are already indexed', async () => {
    const store = new FakeSearchStore();
    const embeddings = new FakeEmbeddingProvider();
    const service = new BackfillSearchEmbeddingsService(store, embeddings);

    await expect(service.run()).resolves.toEqual({
      scanned: 1,
      indexed: 1,
      skipped: 0,
    });
    await expect(service.run()).resolves.toEqual({
      scanned: 1,
      indexed: 0,
      skipped: 1,
    });
    expect(embeddings.calls).toBe(1);
  });
});

function event(): EventRecord {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    organizationId: '00000000-0000-4000-8000-000000000002',
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
