import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gt, sql, type SQL } from 'drizzle-orm';
import { DATABASE } from '../../../database/database.constants';
import { events } from '../../../database/schema';
import type { Database } from '../../../database/database.types';
import type {
  CreateEventRecord,
  EventListQuery,
  EventPage,
} from '../../application/ports/event-store';
import {
  EventCatalogReader,
  EventDraftWriter,
  EventPublisher,
} from '../../application/ports/event-store';
import type { EventRecord } from '../../application/models/event.models';

@Injectable()
export class DrizzleEventStore
  implements EventDraftWriter, EventPublisher, EventCatalogReader
{
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async create(input: CreateEventRecord): Promise<EventRecord> {
    const [created] = await this.database
      .insert(events)
      .values(input)
      .returning();

    if (!created) {
      throw new Error('Event insert did not return a row.');
    }

    return eventRecord(created);
  }

  async publishDraftForOrganization(
    eventId: string,
    organizationId: string,
    publishedAt: Date,
  ): Promise<EventRecord | null> {
    const [published] = await this.database
      .update(events)
      .set({ status: 'PUBLISHED', updatedAt: publishedAt })
      .where(
        and(
          eq(events.id, eventId),
          eq(events.organizationId, organizationId),
          eq(events.status, 'DRAFT'),
          gt(events.startsAt, publishedAt),
        ),
      )
      .returning();

    return published ? eventRecord(published) : null;
  }

  listForOrganization(
    organizationId: string,
    query: EventListQuery,
  ): Promise<EventPage> {
    return this.listPage(query, [eq(events.organizationId, organizationId)]);
  }

  listAll(query: EventListQuery): Promise<EventPage> {
    return this.listPage(query, []);
  }

  listPublished(query: EventListQuery): Promise<EventPage> {
    return this.listPage(query, [eq(events.status, 'PUBLISHED')], true);
  }

  async findForOrganization(
    eventId: string,
    organizationId: string,
  ): Promise<EventRecord | null> {
    const [row] = await this.database
      .select()
      .from(events)
      .where(
        and(eq(events.id, eventId), eq(events.organizationId, organizationId)),
      )
      .limit(1);
    return row ? eventRecord(row) : null;
  }

  async findById(eventId: string): Promise<EventRecord | null> {
    const [row] = await this.database
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    return row ? eventRecord(row) : null;
  }

  async findPublished(eventId: string): Promise<EventRecord | null> {
    const [row] = await this.database
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.status, 'PUBLISHED')))
      .limit(1);
    return row ? eventRecord(row) : null;
  }

  private async listPage(
    query: EventListQuery,
    requiredConditions: SQL[],
    chronological = false,
  ): Promise<EventPage> {
    const search = normalizeSearch(query.search ?? '');
    const searchCondition = search
      ? sql`to_tsvector(
          'portuguese',
          translate(
            lower(${events.title} || ' ' || ${events.summary} || ' ' || ${events.category} || ' ' || ${events.city} || ' ' || ${events.venue}),
            'áàãâäéèêëíìîïóòõôöúùûüç',
            'aaaaaeeeeiiiiooooouuuuc'
          )
        ) @@ websearch_to_tsquery('portuguese', ${search})`
      : undefined;
    const where = and(...requiredConditions, searchCondition);
    const offset = (query.page - 1) * query.pageSize;
    const [rows, totals] = await Promise.all([
      this.database
        .select()
        .from(events)
        .where(where)
        .orderBy(chronological ? asc(events.startsAt) : desc(events.createdAt))
        .limit(query.pageSize)
        .offset(offset),
      this.database.select({ total: count() }).from(events).where(where),
    ]);

    return {
      items: rows.map(eventRecord),
      total: totals[0]?.total ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function eventRecord(row: typeof events.$inferSelect): EventRecord {
  if (row.currency !== 'BRL') {
    throw new Error(`Unsupported event currency ${row.currency}.`);
  }

  return {
    ...row,
    currency: 'BRL',
  };
}
