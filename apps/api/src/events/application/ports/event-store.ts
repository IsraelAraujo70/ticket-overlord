import type { EventRecord } from '../../domain/event.types';

export type CreateEventRecord = Omit<EventRecord, 'createdAt' | 'updatedAt'>;

export abstract class EventStore {
  abstract create(input: CreateEventRecord): Promise<EventRecord>;
  abstract listForOrganization(organizationId: string): Promise<EventRecord[]>;
  abstract listPublished(): Promise<EventRecord[]>;
  abstract findForOrganization(
    eventId: string,
    organizationId: string,
  ): Promise<EventRecord | null>;
  abstract findPublished(eventId: string): Promise<EventRecord | null>;
}
