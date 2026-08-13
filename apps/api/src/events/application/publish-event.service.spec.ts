import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import type { EventRecord } from '../domain/event.types';
import { PublishEventService } from './publish-event.service';
import { EventImageStorage } from './ports/event-image-storage';
import { EventStore } from './ports/event-store';

const organizer: AuthenticatedUser = {
  id: 'user-1',
  fullName: 'Olívia Organizadora',
  email: 'organizer@example.com',
  role: 'ORGANIZER',
  organizationId: 'organization-1',
};

const draft: EventRecord = {
  id: 'event-1',
  organizationId: 'organization-1',
  externalSource: 'TMDB',
  externalId: '157336',
  slug: 'interestelar-event-1',
  title: 'Interestelar',
  summary: 'Uma jornada para além das estrelas.',
  category: 'Cinema',
  sourceReleaseDate: '2014-11-05',
  sourceImageUrl: null,
  startsAt: new Date('2099-09-05T22:00:00.000Z'),
  venue: 'Cine Belas Artes',
  city: 'São Paulo',
  capacity: 150,
  priceInCents: 4500,
  currency: 'BRL',
  coverObjectKey: 'organizations/organization-1/events/event-1/cover.webp',
  coverContentType: 'image/webp',
  status: 'DRAFT',
  createdAt: new Date('2026-08-11T18:00:00.000Z'),
  updatedAt: new Date('2026-08-11T18:00:00.000Z'),
};

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

class FakeEventStore extends EventStore {
  event: EventRecord | null = { ...draft };

  create(): Promise<EventRecord> {
    throw new Error('Not implemented for this test.');
  }

  publishDraftForOrganization(
    eventId: string,
    organizationId: string,
    publishedAt: Date,
  ): Promise<EventRecord | null> {
    if (
      !this.event ||
      this.event.id !== eventId ||
      this.event.organizationId !== organizationId ||
      this.event.status !== 'DRAFT' ||
      this.event.startsAt <= publishedAt
    ) {
      return Promise.resolve(null);
    }

    this.event = { ...this.event, status: 'PUBLISHED', updatedAt: publishedAt };
    return Promise.resolve(this.event);
  }

  listForOrganization(): Promise<EventRecord[]> {
    return Promise.resolve([]);
  }

  listAll(): Promise<EventRecord[]> {
    return Promise.resolve(this.event ? [this.event] : []);
  }

  listPublished(): Promise<EventRecord[]> {
    return Promise.resolve([]);
  }

  findForOrganization(
    eventId: string,
    organizationId: string,
  ): Promise<EventRecord | null> {
    return Promise.resolve(
      this.event?.id === eventId && this.event.organizationId === organizationId
        ? this.event
        : null,
    );
  }

  findById(eventId: string): Promise<EventRecord | null> {
    return Promise.resolve(this.event?.id === eventId ? this.event : null);
  }

  findPublished(): Promise<EventRecord | null> {
    return Promise.resolve(null);
  }
}

describe('PublishEventService', () => {
  let store: FakeEventStore;
  let service: PublishEventService;

  beforeEach(() => {
    store = new FakeEventStore();
    service = new PublishEventService(store, new FakeImageStorage());
  });

  it('publishes an owned future draft', async () => {
    await expect(service.publish(organizer, draft.id)).resolves.toMatchObject({
      id: draft.id,
      status: 'PUBLISHED',
      coverUrl: expect.stringContaining(draft.coverObjectKey) as string,
    });
  });

  it('returns an already published event idempotently', async () => {
    store.event = { ...draft, status: 'PUBLISHED' };

    await expect(service.publish(organizer, draft.id)).resolves.toMatchObject({
      id: draft.id,
      status: 'PUBLISHED',
    });
  });

  it('hides events owned by another organization', async () => {
    await expect(
      service.publish(
        { ...organizer, organizationId: 'organization-2' },
        draft.id,
      ),
    ).rejects.toMatchObject({ code: 'EVENT_NOT_FOUND' });
  });

  it('rejects a draft whose session already started', async () => {
    store.event = {
      ...draft,
      startsAt: new Date('2020-01-01T00:00:00.000Z'),
    };

    await expect(service.publish(organizer, draft.id)).rejects.toMatchObject({
      code: 'INVALID_EVENT_DATE',
    });
  });
});
