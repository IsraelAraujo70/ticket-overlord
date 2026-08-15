import { EventImageStorage } from '../../events/application/ports/event-image-storage';
import { CheckoutError } from '../domain/checkout.errors';
import type { PublishedEventDetail } from './models/checkout.models';
import { GetPublishedEventService } from './get-published-event.service';
import {
  InventorySynchronizer,
  PublishedEventReader,
} from './ports/confirmed-checkout-store';
import { InventoryAvailabilityStore } from './ports/inventory-hold-store';

const event: PublishedEventDetail = {
  id: 'event-id',
  slug: 'event-slug',
  title: 'Event',
  summary: 'Summary',
  category: 'Cinema',
  sourceReleaseDate: null,
  sourceImageUrl: null,
  startsAt: new Date('2099-09-05T22:00:00.000Z'),
  venue: 'Venue',
  city: 'City',
  capacity: 100,
  priceInCents: 2500,
  currency: 'BRL',
  coverObjectKey: 'events/event-id/cover.png',
  coverContentType: 'image/png',
  availableQuantity: 100,
  maxQuantityPerReservation: 10,
  isPurchasable: true,
};

describe('GetPublishedEventService', () => {
  it('turns the detail informational if the event starts while availability is loading', async () => {
    const store = {
      findPublishedEventBySlug: jest.fn().mockResolvedValue(event),
      synchronizeInventory: jest
        .fn()
        .mockRejectedValue(
          new CheckoutError(
            'EVENT_NOT_AVAILABLE',
            'Evento não disponível para venda.',
          ),
        ),
    } as unknown as PublishedEventReader & InventorySynchronizer;
    const available = jest.fn();
    const holds = { available } as unknown as InventoryAvailabilityStore;
    const images = {
      createReadUrl: jest.fn().mockResolvedValue('https://example.com/cover'),
    } as unknown as EventImageStorage;
    const service = new GetPublishedEventService(store, store, holds, images);

    await expect(service.bySlug(event.slug)).resolves.toMatchObject({
      id: event.id,
      availableQuantity: 0,
      isPurchasable: false,
    });
    expect(available).not.toHaveBeenCalled();
  });
});
