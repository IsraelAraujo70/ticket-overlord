import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { EventRecord } from '../../events/application/models/event.models';
import { EmbeddingProvider } from './ports/embedding-provider';
import { SearchEmbeddingIndexStore } from './ports/published-event-search';

export interface SearchBackfillResult {
  scanned: number;
  indexed: number;
  skipped: number;
}

@Injectable()
export class BackfillSearchEmbeddingsService {
  private readonly logger = new Logger(BackfillSearchEmbeddingsService.name);

  constructor(
    private readonly searchStore: SearchEmbeddingIndexStore,
    private readonly embeddings: EmbeddingProvider,
  ) {}

  /** Indexes published events idempotently in bounded provider batches. */
  async run(batchSize = 50): Promise<SearchBackfillResult> {
    if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 100) {
      throw new Error('Search backfill batch size must be between 1 and 100.');
    }
    if (!this.embeddings.isConfigured()) {
      throw new Error(
        'OPENROUTER_API_KEY is required for the search backfill.',
      );
    }

    const result: SearchBackfillResult = { scanned: 0, indexed: 0, skipped: 0 };
    let cursor: string | null = null;
    let batches = 0;

    while (true) {
      const candidates = await this.searchStore.listIndexCandidates(
        cursor,
        batchSize,
      );
      if (candidates.length === 0) break;

      result.scanned += candidates.length;
      batches += 1;
      cursor = candidates.at(-1)?.event.id ?? cursor;
      const stale = candidates
        .map((candidate) => {
          const document = eventSearchDocument(candidate.event);
          return {
            ...candidate,
            document,
            contentHash: createHash('sha256').update(document).digest('hex'),
          };
        })
        .filter(
          (candidate) =>
            candidate.indexedContentHash !== candidate.contentHash ||
            candidate.indexedModel !== this.embeddings.model,
        );

      result.skipped += candidates.length - stale.length;
      if (stale.length === 0) continue;

      const vectors = await this.embeddings.embedDocuments(
        stale.map((candidate) => candidate.document),
      );
      if (vectors.length !== stale.length) {
        throw new Error(
          'Embedding provider returned an unexpected batch size.',
        );
      }

      await this.searchStore.upsertEmbeddings(
        stale.map((candidate, index) => ({
          eventId: candidate.event.id,
          contentHash: candidate.contentHash,
          model: this.embeddings.model,
          embedding: vectors[index],
        })),
      );
      result.indexed += stale.length;
      if (batches % 10 === 0) {
        this.logger.log(
          `Search backfill progress: ${result.scanned} scanned, ${result.indexed} indexed, ${result.skipped} unchanged.`,
        );
      }
    }

    return result;
  }
}

function eventSearchDocument(event: EventRecord): string {
  return [
    `Título: ${event.title}`,
    `Categoria: ${event.category}`,
    `Cidade: ${event.city}`,
    `Local: ${event.venue}`,
    `Descrição: ${event.summary}`,
  ].join('\n');
}
