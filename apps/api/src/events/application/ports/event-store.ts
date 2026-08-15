import type { EventRecord } from '../models/event.models';

export type CreateEventRecord = Omit<EventRecord, 'createdAt' | 'updatedAt'>;

export interface EventListQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export interface EventPage {
  items: EventRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export abstract class EventDraftWriter {
  abstract create(input: CreateEventRecord): Promise<EventRecord>;
}

export abstract class EventPublisher {
  abstract publishDraftForOrganization(
    eventId: string,
    organizationId: string,
    publishedAt: Date,
  ): Promise<EventRecord | null>;
  abstract findForOrganization(
    eventId: string,
    organizationId: string,
  ): Promise<EventRecord | null>;
}

export abstract class EventCatalogReader {
  abstract listForOrganization(
    organizationId: string,
    query: EventListQuery,
  ): Promise<EventPage>;
  abstract listAll(query: EventListQuery): Promise<EventPage>;
  abstract listPublished(query: EventListQuery): Promise<EventPage>;
  abstract findForOrganization(
    eventId: string,
    organizationId: string,
  ): Promise<EventRecord | null>;
  abstract findById(eventId: string): Promise<EventRecord | null>;
  abstract findPublished(eventId: string): Promise<EventRecord | null>;
}
