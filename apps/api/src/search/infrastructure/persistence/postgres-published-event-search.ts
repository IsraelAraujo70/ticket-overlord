import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/database.constants';
import type { EventRecord } from '../../../events/application/models/event.models';
import type {
  SearchEventPage,
  SearchIndexCandidate,
  SearchQuery,
  SearchSuggestion,
  SearchSuggestionKind,
} from '../../application/models/search.models';
import {
  PublishedEventSearchReader,
  SearchEmbeddingIndexStore,
} from '../../application/ports/published-event-search';

const HYBRID_CANDIDATE_LIMIT = 1_000;

interface EventRow {
  id: string;
  organization_id: string;
  external_source: 'TMDB' | null;
  external_id: string | null;
  slug: string;
  title: string;
  summary: string;
  category: string;
  source_release_date: string | null;
  source_image_url: string | null;
  starts_at: Date;
  venue: string;
  city: string;
  capacity: number;
  price_in_cents: number;
  currency: string;
  cover_object_key: string;
  cover_content_type: string;
  status: 'DRAFT' | 'PUBLISHED';
  created_at: Date;
  updated_at: Date;
  total_count?: string;
}

interface SuggestionRow {
  kind: SearchSuggestionKind;
  label: string;
  value: string;
  slug: string | null;
}

interface IndexCandidateRow extends EventRow {
  indexed_content_hash: string | null;
  indexed_model: string | null;
}

@Injectable()
export class PostgresPublishedEventSearch
  implements PublishedEventSearchReader, SearchEmbeddingIndexStore
{
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async searchLexical(query: SearchQuery): Promise<SearchEventPage> {
    const offset = (query.page - 1) * query.pageSize;
    const result = await this.pool.query<EventRow>(
      `WITH search_query AS (
         SELECT websearch_to_tsquery('portuguese', $1) AS value
       )
       SELECT e.*, count(*) OVER() AS total_count
       FROM events e, search_query q
       WHERE e.status = 'PUBLISHED'
         AND e.search_document @@ q.value
       ORDER BY (
         ts_rank_cd(e.search_document, q.value, 32)
         + CASE WHEN e.search_title = $2 THEN 2.0 WHEN e.search_title LIKE $2 || '%' THEN 1.0 ELSE 0 END
         + CASE WHEN e.search_category = $2 OR e.search_city = $2 OR e.search_venue = $2 THEN 0.75 ELSE 0 END
       ) DESC, e.starts_at ASC, e.id ASC
       LIMIT $3 OFFSET $4`,
      [query.query, normalizeForDatabase(query.query), query.pageSize, offset],
    );

    return pageFromRows(result.rows, query);
  }

  async searchHybrid(
    query: SearchQuery,
    embedding: readonly number[],
  ): Promise<SearchEventPage> {
    const offset = (query.page - 1) * query.pageSize;
    const vector = vectorLiteral(embedding);
    const result = await this.pool.query<EventRow>(
      `WITH search_query AS (
         SELECT websearch_to_tsquery('portuguese', $1) AS value
       ), lexical AS (
         SELECT e.id,
           row_number() OVER (ORDER BY (
             ts_rank_cd(e.search_document, q.value, 32)
             + CASE WHEN e.search_title = $2 THEN 2.0 WHEN e.search_title LIKE $2 || '%' THEN 1.0 ELSE 0 END
             + CASE WHEN e.search_category = $2 OR e.search_city = $2 OR e.search_venue = $2 THEN 0.75 ELSE 0 END
           ) DESC, e.starts_at ASC, e.id ASC) AS position
         FROM events e, search_query q
         WHERE e.status = 'PUBLISHED' AND e.search_document @@ q.value
         ORDER BY (
           ts_rank_cd(e.search_document, q.value, 32)
           + CASE WHEN e.search_title = $2 THEN 2.0 WHEN e.search_title LIKE $2 || '%' THEN 1.0 ELSE 0 END
           + CASE WHEN e.search_category = $2 OR e.search_city = $2 OR e.search_venue = $2 THEN 0.75 ELSE 0 END
         ) DESC, e.starts_at ASC, e.id ASC
         LIMIT $3
       ), semantic AS (
         SELECT e.id,
           row_number() OVER (ORDER BY i.embedding <=> $4::vector, e.starts_at ASC, e.id ASC) AS position
         FROM event_search_embeddings i
         JOIN events e ON e.id = i.event_id
         WHERE e.status = 'PUBLISHED'
         ORDER BY i.embedding <=> $4::vector, e.starts_at ASC, e.id ASC
         LIMIT $3
       ), fused AS (
         SELECT coalesce(l.id, s.id) AS id,
           coalesce(1.0 / (60 + l.position), 0) +
           coalesce(1.0 / (60 + s.position), 0) AS score
         FROM lexical l
         FULL OUTER JOIN semantic s ON s.id = l.id
       )
       SELECT e.*, count(*) OVER() AS total_count
       FROM fused f
       JOIN events e ON e.id = f.id
       ORDER BY f.score DESC, e.starts_at ASC, e.id ASC
       LIMIT $5 OFFSET $6`,
      [
        query.query,
        normalizeForDatabase(query.query),
        HYBRID_CANDIDATE_LIMIT,
        vector,
        query.pageSize,
        offset,
      ],
    );

    return pageFromRows(result.rows, query);
  }

  async suggest(query: string, limit: number): Promise<SearchSuggestion[]> {
    const normalized = normalizeForDatabase(query);
    const result = await this.pool.query<SuggestionRow>(
      `WITH candidates AS (
         SELECT 'EVENT'::text AS kind, title AS label, title AS value, slug,
           search_title AS normalized, starts_at
         FROM events
         WHERE status = 'PUBLISHED'
           AND (search_title LIKE $1 || '%' OR similarity(search_title, $1) >= 0.25)
         UNION ALL
         SELECT 'CATEGORY', category, category, NULL, search_category, min(starts_at)
         FROM events
         WHERE status = 'PUBLISHED'
           AND (search_category LIKE $1 || '%' OR similarity(search_category, $1) >= 0.25)
         GROUP BY category, search_category
         UNION ALL
         SELECT 'CITY', city, city, NULL, search_city, min(starts_at)
         FROM events
         WHERE status = 'PUBLISHED'
           AND (search_city LIKE $1 || '%' OR similarity(search_city, $1) >= 0.25)
         GROUP BY city, search_city
         UNION ALL
         SELECT 'VENUE', venue, venue, NULL, search_venue, min(starts_at)
         FROM events
         WHERE status = 'PUBLISHED'
           AND (search_venue LIKE $1 || '%' OR similarity(search_venue, $1) >= 0.25)
         GROUP BY venue, search_venue
       ), ranked AS (
         SELECT *, row_number() OVER (
           PARTITION BY kind, label
           ORDER BY starts_at ASC, slug NULLS LAST
         ) AS duplicate_position
         FROM candidates
       ), deduplicated AS (
         SELECT *
         FROM ranked
         WHERE duplicate_position = 1
       ), bounded AS (
         SELECT *, row_number() OVER (
           PARTITION BY kind
           ORDER BY CASE WHEN normalized = $1 THEN 0 WHEN normalized LIKE $1 || '%' THEN 1 ELSE 2 END,
             similarity(normalized, $1) DESC, starts_at ASC, label ASC
         ) AS kind_position
         FROM deduplicated
       )
       SELECT kind, label, value, slug
       FROM bounded
       WHERE kind_position <= CASE WHEN kind = 'EVENT' THEN 4 ELSE 2 END
       ORDER BY CASE WHEN normalized = $1 THEN 0 WHEN normalized LIKE $1 || '%' THEN 1 ELSE 2 END,
         similarity(normalized, $1) DESC, starts_at ASC, label ASC
       LIMIT $2`,
      [normalized, limit],
    );

    return result.rows;
  }

  async listIndexCandidates(
    afterEventId: string | null,
    limit: number,
  ): Promise<SearchIndexCandidate[]> {
    const result = await this.pool.query<IndexCandidateRow>(
      `SELECT e.*, i.content_hash AS indexed_content_hash, i.model AS indexed_model
       FROM events e
       LEFT JOIN event_search_embeddings i ON i.event_id = e.id
       WHERE e.status = 'PUBLISHED' AND ($1::uuid IS NULL OR e.id > $1::uuid)
       ORDER BY e.id ASC
       LIMIT $2`,
      [afterEventId, limit],
    );

    return result.rows.map((row) => ({
      event: eventFromRow(row),
      indexedContentHash: row.indexed_content_hash,
      indexedModel: row.indexed_model,
    }));
  }

  async upsertEmbeddings(
    entries: readonly {
      eventId: string;
      contentHash: string;
      model: string;
      embedding: readonly number[];
    }[],
  ): Promise<void> {
    if (entries.length === 0) return;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const entry of entries) {
        await client.query(
          `INSERT INTO event_search_embeddings (event_id, embedding, content_hash, model, indexed_at)
           VALUES ($1, $2::vector, $3, $4, now())
           ON CONFLICT (event_id) DO UPDATE SET
             embedding = EXCLUDED.embedding,
             content_hash = EXCLUDED.content_hash,
             model = EXCLUDED.model,
             indexed_at = EXCLUDED.indexed_at`,
          [
            entry.eventId,
            vectorLiteral(entry.embedding),
            entry.contentHash,
            entry.model,
          ],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

function pageFromRows(rows: EventRow[], query: SearchQuery): SearchEventPage {
  return {
    items: rows.map(eventFromRow),
    total: Number(rows[0]?.total_count ?? 0),
    page: query.page,
    pageSize: query.pageSize,
  };
}

function eventFromRow(row: EventRow): EventRecord {
  if (row.currency !== 'BRL') {
    throw new Error(`Unsupported event currency ${row.currency}.`);
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    externalSource: row.external_source,
    externalId: row.external_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    sourceReleaseDate: row.source_release_date,
    sourceImageUrl: row.source_image_url,
    startsAt: row.starts_at,
    venue: row.venue,
    city: row.city,
    capacity: row.capacity,
    priceInCents: row.price_in_cents,
    currency: 'BRL',
    coverObjectKey: row.cover_object_key,
    coverContentType: row.cover_content_type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeForDatabase(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function vectorLiteral(vector: readonly number[]): string {
  if (vector.length === 0 || vector.some((value) => !Number.isFinite(value))) {
    throw new Error('Embedding must contain only finite numeric values.');
  }
  return `[${vector.join(',')}]`;
}
