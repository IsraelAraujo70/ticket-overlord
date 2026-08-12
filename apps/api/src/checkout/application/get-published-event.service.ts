import { Injectable } from '@nestjs/common';
import { EventImageStorage } from '../../events/application/ports/event-image-storage';
import { CheckoutError } from '../domain/checkout.errors';
import type { PublishedEventDetail } from '../domain/checkout.types';
import { ConfirmedCheckoutStore } from './ports/confirmed-checkout-store';
import { InventoryHoldStore } from './ports/inventory-hold-store';

export type PresentedPublishedEvent = Omit<
  PublishedEventDetail,
  'coverObjectKey'
> & { coverUrl: string };

@Injectable()
export class GetPublishedEventService {
  constructor(
    private readonly store: ConfirmedCheckoutStore,
    private readonly holds: InventoryHoldStore,
    private readonly images: EventImageStorage,
  ) {}

  /** Returns a future published event with its current logical availability. */
  async bySlug(slug: string): Promise<PresentedPublishedEvent> {
    const event = await this.store.findPublishedEventBySlug(slug);
    if (!event) {
      throw new CheckoutError(
        'EVENT_NOT_AVAILABLE',
        'Evento não disponível para venda.',
      );
    }

    const { coverObjectKey, ...published } = event;
    return {
      ...published,
      availableQuantity: await this.store.synchronizeInventory(
        event.id,
        (snapshot) => this.holds.available(snapshot),
      ),
      coverUrl: await this.images.createReadUrl(coverObjectKey),
    };
  }
}
