import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt } from 'drizzle-orm';
import { DATABASE } from '../../../database/database.constants';
import { events } from '../../../database/schema';
import type { Database } from '../../../database/database.types';
import type { CreateEventRecord } from '../../application/ports/event-store';
import { EventStore } from '../../application/ports/event-store';
import type { EventRecord } from '../../domain/event.types';

@Injectable()
export class DrizzleEventStore extends EventStore {
  constructor(@Inject(DATABASE) private readonly database: Database) {
    super();
  }

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

  async listForOrganization(organizationId: string): Promise<EventRecord[]> {
    const rows = await this.database
      .select()
      .from(events)
      .where(eq(events.organizationId, organizationId))
      .orderBy(desc(events.createdAt));
    return rows.map(eventRecord);
  }

  async listPublished(): Promise<EventRecord[]> {
    const rows = await this.database
      .select()
      .from(events)
      .where(eq(events.status, 'PUBLISHED'))
      .orderBy(asc(events.startsAt));
    return rows.map(eventRecord);
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

  async findPublished(eventId: string): Promise<EventRecord | null> {
    const [row] = await this.database
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.status, 'PUBLISHED')))
      .limit(1);
    return row ? eventRecord(row) : null;
  }
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
