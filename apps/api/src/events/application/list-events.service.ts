import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { EventError } from '../domain/event.errors';
import type { PresentedEvent } from '../domain/event.types';
import { organizerOrganization, presentEvent } from './create-event.service';
import { EventImageStorage } from './ports/event-image-storage';
import { EventStore } from './ports/event-store';

@Injectable()
export class ListEventsService {
  constructor(
    private readonly store: EventStore,
    private readonly images: EventImageStorage,
  ) {}

  async forOrganizer(user: AuthenticatedUser): Promise<PresentedEvent[]> {
    const events =
      user.role === 'ADMIN'
        ? await this.store.listAll()
        : await this.store.listForOrganization(organizerOrganization(user));
    return Promise.all(events.map((event) => presentEvent(event, this.images)));
  }

  async published(): Promise<PresentedEvent[]> {
    const events = await this.store.listPublished();
    return Promise.all(events.map((event) => presentEvent(event, this.images)));
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
}
