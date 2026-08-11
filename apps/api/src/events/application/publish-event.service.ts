import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { EventError } from '../domain/event.errors';
import type { PresentedEvent } from '../domain/event.types';
import { organizerOrganization, presentEvent } from './create-event.service';
import { EventImageStorage } from './ports/event-image-storage';
import { EventStore } from './ports/event-store';

@Injectable()
export class PublishEventService {
  constructor(
    private readonly store: EventStore,
    private readonly images: EventImageStorage,
  ) {}

  /** Publishes an owned future draft and treats an already published event idempotently. */
  async publish(
    user: AuthenticatedUser,
    eventId: string,
  ): Promise<PresentedEvent> {
    const organizationId = organizerOrganization(user);
    const publishedAt = new Date();
    const published = await this.store.publishDraftForOrganization(
      eventId,
      organizationId,
      publishedAt,
    );

    if (published) {
      return presentEvent(published, this.images);
    }

    const event = await this.store.findForOrganization(eventId, organizationId);

    if (!event) {
      throw new EventError('EVENT_NOT_FOUND', 'Evento não encontrado.');
    }

    if (event.status === 'PUBLISHED') {
      return presentEvent(event, this.images);
    }

    throw new EventError(
      'INVALID_EVENT_DATE',
      'Não é possível publicar um evento cuja sessão já começou.',
    );
  }
}
