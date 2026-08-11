import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { CreateEventService } from './create-event.service';
import {
  EventImageStorage,
  type StoreEventImageInput,
} from './ports/event-image-storage';
import { EventStore, type CreateEventRecord } from './ports/event-store';
import { ExternalMovieCatalog } from './ports/external-movie-catalog';
import type { EventRecord, ExternalMovie } from '../domain/event.types';

const organizer: AuthenticatedUser = {
  id: 'user-1',
  fullName: 'Olívia Organizadora',
  email: 'organizer@example.com',
  role: 'ORGANIZER',
  organizationId: 'organization-1',
};
const movie: ExternalMovie = {
  externalId: '157336',
  title: 'Interestelar',
  summary: 'Uma jornada para além das estrelas.',
  releaseDate: '2014-11-05',
  imageUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
};
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

class FakeMovieCatalog extends ExternalMovieCatalog {
  search(): Promise<ExternalMovie[]> {
    return Promise.resolve([movie]);
  }

  findById(externalId: string): Promise<ExternalMovie | null> {
    return Promise.resolve(externalId === movie.externalId ? movie : null);
  }
}

class FakeImageStorage extends EventImageStorage {
  stored: StoreEventImageInput[] = [];
  deleted: string[] = [];

  store(input: StoreEventImageInput): Promise<void> {
    this.stored.push(input);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.deleted.push(key);
    return Promise.resolve();
  }

  createReadUrl(key: string): Promise<string> {
    return Promise.resolve(`https://storage.test/${key}`);
  }
}

class FakeEventStore extends EventStore {
  created: CreateEventRecord[] = [];
  failure: Error | null = null;

  create(input: CreateEventRecord): Promise<EventRecord> {
    if (this.failure) throw this.failure;
    this.created.push(input);
    return Promise.resolve({
      ...input,
      createdAt: new Date('2026-08-11T18:00:00Z'),
      updatedAt: new Date('2026-08-11T18:00:00Z'),
    });
  }

  listForOrganization(): Promise<EventRecord[]> {
    return Promise.resolve([]);
  }

  listPublished(): Promise<EventRecord[]> {
    return Promise.resolve([]);
  }

  findForOrganization(): Promise<EventRecord | null> {
    return Promise.resolve(null);
  }

  findPublished(): Promise<EventRecord | null> {
    return Promise.resolve(null);
  }
}

describe('CreateEventService', () => {
  let images: FakeImageStorage;
  let store: FakeEventStore;
  let service: CreateEventService;

  beforeEach(() => {
    images = new FakeImageStorage();
    store = new FakeEventStore();
    service = new CreateEventService(new FakeMovieCatalog(), store, images);
  });

  it('copies the external movie and creates an organization draft', async () => {
    const event = await service.create(organizer, {
      externalId: movie.externalId,
      startsAt: '2099-09-05T22:00:00.000Z',
      venue: 'Cine Belas Artes',
      city: 'São Paulo',
      capacity: 150,
      priceInCents: 4500,
      cover: png,
    });

    expect(store.created).toHaveLength(1);
    expect(store.created[0]).toMatchObject({
      organizationId: organizer.organizationId,
      externalSource: 'TMDB',
      externalId: movie.externalId,
      title: movie.title,
      status: 'DRAFT',
      capacity: 150,
      priceInCents: 4500,
      coverContentType: 'image/png',
    });
    expect(images.stored[0]).toMatchObject({ contentType: 'image/png' });
    expect(event.coverUrl).toContain('/organizations/organization-1/events/');
  });

  it('rejects non-organizers before writing storage', async () => {
    await expect(
      service.create(
        { ...organizer, role: 'CUSTOMER', organizationId: null },
        {
          externalId: movie.externalId,
          startsAt: '2099-09-05T22:00:00.000Z',
          venue: 'Cine Belas Artes',
          city: 'São Paulo',
          capacity: 150,
          priceInCents: 4500,
          cover: png,
        },
      ),
    ).rejects.toMatchObject({ code: 'ORGANIZER_REQUIRED' });
    expect(images.stored).toHaveLength(0);
  });

  it('rejects a file whose content is not an allowed image', async () => {
    await expect(
      service.create(organizer, {
        externalId: movie.externalId,
        startsAt: '2099-09-05T22:00:00.000Z',
        venue: 'Cine Belas Artes',
        city: 'São Paulo',
        capacity: 150,
        priceInCents: 4500,
        cover: Buffer.from('<script>alert(1)</script>'),
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EVENT_IMAGE' });
  });

  it('removes the uploaded cover when persistence fails', async () => {
    store.failure = new Error('database unavailable');

    await expect(
      service.create(organizer, {
        externalId: movie.externalId,
        startsAt: '2099-09-05T22:00:00.000Z',
        venue: 'Cine Belas Artes',
        city: 'São Paulo',
        capacity: 150,
        priceInCents: 4500,
        cover: png,
      }),
    ).rejects.toThrow('database unavailable');
    expect(images.deleted).toEqual([images.stored[0].key]);
  });
});
