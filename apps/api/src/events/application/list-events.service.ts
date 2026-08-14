import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { EventError } from '../domain/event.errors';
import type { PresentedEvent } from '../domain/event.types';
import { organizerOrganization, presentEvent } from './create-event.service';
import { EventImageStorage } from './ports/event-image-storage';
import { EventStore } from './ports/event-store';
import type { EventListQuery } from './ports/event-store';

export interface PresentedEventPage {
  items: PresentedEvent[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListEventsService {
  constructor(
    private readonly store: EventStore,
    private readonly images: EventImageStorage,
  ) {}

  async forOrganizer(
    user: AuthenticatedUser,
    query: EventListQuery,
  ): Promise<PresentedEventPage> {
    const result =
      user.role === 'ADMIN'
        ? await this.store.listAll(query)
        : await this.store.listForOrganization(
            organizerOrganization(user),
            query,
          );
    return this.presentPage(result);
  }

  async published(query: EventListQuery): Promise<PresentedEventPage> {
    return this.presentPage(await this.store.listPublished(query));
  }

  async coverForOrganizer(
    user: AuthenticatedUser,
    eventId: string,
  ): Promise<string> {
    const event =
      user.role === 'ADMIN'
        ? await this.store.findById(eventId)
        : await this.store.findForOrganization(
            eventId,
            organizerOrganization(user),
          );
    return this.coverUrl(event);
  }

  async publishedCover(eventId: string): Promise<string> {
    const event = await this.store.findPublished(eventId);
    return this.coverUrl(event);
  }

  private async coverUrl(
    event: Awaited<ReturnType<EventStore['findPublished']>>,
  ): Promise<string> {
    if (!event) {
      throw new EventError('EVENT_NOT_FOUND', 'Evento não encontrado.');
    }

    return this.images.createReadUrl(event.coverObjectKey);
  }

  private async presentPage(
    page: Awaited<ReturnType<EventStore['listPublished']>>,
  ): Promise<PresentedEventPage> {
    return {
      ...page,
      items: await Promise.all(
        page.items.map((event) => presentEvent(event, this.images)),
      ),
    };
  }
}
