import { Injectable } from '@nestjs/common';
import { EventImageStorage } from '../../events/application/ports/event-image-storage';
import { CheckoutError } from '../domain/checkout.errors';
import type { PublishedEventDetail } from './models/checkout.models';
import {
  InventorySynchronizer,
  PublishedEventReader,
} from './ports/confirmed-checkout-store';
import { InventoryAvailabilityStore } from './ports/inventory-hold-store';

export type PresentedPublishedEvent = Omit<
  PublishedEventDetail,
  'coverObjectKey'
> & { coverUrl: string };

@Injectable()
export class GetPublishedEventService {
  constructor(
    private readonly events: PublishedEventReader,
    private readonly inventory: InventorySynchronizer,
    private readonly holds: InventoryAvailabilityStore,
    private readonly images: EventImageStorage,
  ) {}

  /** Returns a published event and exposes whether it can still be purchased. */
  async bySlug(slug: string): Promise<PresentedPublishedEvent> {
    const event = await this.events.findPublishedEventBySlug(slug);
    if (!event) {
      throw new CheckoutError(
        'EVENT_NOT_AVAILABLE',
        'Evento não disponível para venda.',
      );
    }

    const { coverObjectKey, ...published } = event;
    let isPurchasable = event.isPurchasable;
    let availableQuantity = 0;

    if (isPurchasable) {
      try {
        availableQuantity = await this.inventory.synchronizeInventory(
          event.id,
          (snapshot) => this.holds.available(snapshot),
        );
      } catch (error) {
        if (
          !(error instanceof CheckoutError) ||
          error.code !== 'EVENT_NOT_AVAILABLE'
        ) {
          throw error;
        }
        isPurchasable = false;
      }
    }

    return {
      ...published,
      availableQuantity,
      isPurchasable,
      coverUrl: await this.images.createReadUrl(coverObjectKey),
    };
  }
}
