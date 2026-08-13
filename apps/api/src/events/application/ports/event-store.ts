import type { EventRecord } from '../../domain/event.types';

export type CreateEventRecord = Omit<EventRecord, 'createdAt' | 'updatedAt'>;

export abstract class EventStore {
  abstract create(input: CreateEventRecord): Promise<EventRecord>;
  abstract publishDraftForOrganization(
    eventId: string,
    organizationId: string,
    publishedAt: Date,
  ): Promise<EventRecord | null>;
  abstract listForOrganization(organizationId: string): Promise<EventRecord[]>;
  abstract listAll(): Promise<EventRecord[]>;
  abstract listPublished(): Promise<EventRecord[]>;
  abstract findForOrganization(
    eventId: string,
    organizationId: string,
  ): Promise<EventRecord | null>;
  abstract findById(eventId: string): Promise<EventRecord | null>;
  abstract findPublished(eventId: string): Promise<EventRecord | null>;
}
