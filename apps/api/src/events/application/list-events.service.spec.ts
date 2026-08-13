import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import type { EventRecord } from '../domain/event.types';
import { ListEventsService } from './list-events.service';
import { EventImageStorage } from './ports/event-image-storage';
import { EventStore } from './ports/event-store';

const events: EventRecord[] = [
  event('event-1', 'organization-1'),
  event('event-2', 'organization-2'),
];

class FakeEventStore extends EventStore {
  create(): Promise<EventRecord> {
    throw new Error('Not implemented for this test.');
  }
  publishDraftForOrganization(): Promise<EventRecord | null> {
    return Promise.resolve(null);
  }
  listForOrganization(organizationId: string): Promise<EventRecord[]> {
    return Promise.resolve(
      events.filter((item) => item.organizationId === organizationId),
    );
  }
  listAll(): Promise<EventRecord[]> {
    return Promise.resolve(events);
  }
  listPublished(): Promise<EventRecord[]> {
    return Promise.resolve(
      events.filter((item) => item.status === 'PUBLISHED'),
    );
  }
  findForOrganization(
    eventId: string,
    organizationId: string,
  ): Promise<EventRecord | null> {
    return Promise.resolve(
      events.find(
        (item) => item.id === eventId && item.organizationId === organizationId,
      ) ?? null,
    );
  }
  findById(eventId: string): Promise<EventRecord | null> {
    return Promise.resolve(events.find((item) => item.id === eventId) ?? null);
  }
  findPublished(eventId: string): Promise<EventRecord | null> {
    return Promise.resolve(
      events.find(
        (item) => item.id === eventId && item.status === 'PUBLISHED',
      ) ?? null,
    );
  }
}

class FakeImageStorage extends EventImageStorage {
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

describe('ListEventsService', () => {
  const service = new ListEventsService(
    new FakeEventStore(),
    new FakeImageStorage(),
  );

  it('keeps organizers scoped to their organization', async () => {
    await expect(
      service.forOrganizer(user('ORGANIZER')),
    ).resolves.toMatchObject([
      { id: 'event-1', organizationId: 'organization-1' },
    ]);
  });

  it('lets global admins read every event and cover', async () => {
    const admin = user('ADMIN');

    await expect(service.forOrganizer(admin)).resolves.toHaveLength(2);
    await expect(
      service.coverForOrganizer(admin, 'event-2'),
    ).resolves.toContain('organization-2/events/event-2');
  });
});

function user(role: 'ORGANIZER' | 'ADMIN'): AuthenticatedUser {
  return {
    id: `${role.toLowerCase()}-id`,
    fullName: role,
    email: `${role.toLowerCase()}@example.com`,
    role,
    organizationId: role === 'ORGANIZER' ? 'organization-1' : null,
  };
}

function event(id: string, organizationId: string): EventRecord {
  return {
    id,
    organizationId,
    externalSource: null,
    externalId: null,
    slug: id,
    title: id,
    summary: 'Summary',
    category: 'Teatro',
    sourceReleaseDate: null,
    sourceImageUrl: null,
    startsAt: new Date('2099-08-13T22:00:00.000Z'),
    venue: 'Venue',
    city: 'São Paulo',
    capacity: 100,
    priceInCents: 5000,
    currency: 'BRL',
    coverObjectKey: `organizations/${organizationId}/events/${id}/cover.webp`,
    coverContentType: 'image/webp',
    status: 'DRAFT',
    createdAt: new Date('2026-08-13T15:00:00.000Z'),
    updatedAt: new Date('2026-08-13T15:00:00.000Z'),
  };
}
