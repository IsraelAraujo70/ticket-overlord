import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { EventImageStorage } from '../../events/application/ports/event-image-storage';
import { CheckoutError } from '../domain/checkout.errors';
import { validateReservationQuantity } from '../domain/reservation';
import type {
  ReservationDetail,
  ReservationRecord,
} from './models/checkout.models';
import { requireCustomer } from './customer-access';
import {
  ConfirmedReservationReader,
  InventorySynchronizer,
} from './ports/confirmed-checkout-store';
import {
  InventoryAvailabilityStore,
  ReservationHoldStore,
} from './ports/inventory-hold-store';

export type PresentedReservationDetail = Omit<
  ReservationDetail,
  'customerId' | 'event'
> & {
  event: Omit<ReservationDetail['event'], 'coverObjectKey'> & {
    coverUrl: string;
  };
};

@Injectable()
export class ReservationService {
  constructor(
    private readonly inventory: InventorySynchronizer,
    private readonly confirmed: ConfirmedReservationReader,
    private readonly availability: InventoryAvailabilityStore,
    private readonly holds: ReservationHoldStore,
    private readonly images: EventImageStorage,
  ) {}

  /** Creates a ten-minute inventory hold for an authenticated customer. */
  async create(
    user: AuthenticatedUser,
    eventId: string,
    quantity: number,
  ): Promise<ReservationRecord> {
    const customerId = requireCustomer(user);
    validateReservationQuantity(quantity);
    return this.inventory.synchronizeInventory(eventId, async (snapshot) => {
      await this.availability.initialize(snapshot);
      return this.holds.create({ ...snapshot, customerId, quantity });
    });
  }

  /** Returns and opportunistically expires a reservation owned by the customer. */
  async find(
    user: AuthenticatedUser,
    reservationId: string,
  ): Promise<PresentedReservationDetail> {
    const customerId = requireCustomer(user);
    const reservation =
      (await this.holds.find(reservationId, customerId)) ??
      (await this.confirmed.findConfirmed(customerId, reservationId));
    if (!reservation) {
      throw new CheckoutError(
        'RESERVATION_NOT_FOUND',
        'Reserva não encontrada.',
      );
    }

    const event = await this.confirmed.eventSummary(reservation.eventId);
    if (!event) {
      throw new CheckoutError(
        'RESERVATION_NOT_FOUND',
        'Reserva não encontrada.',
      );
    }
    const { coverObjectKey, ...presentedEvent } = event;
    return {
      id: reservation.id,
      eventId: reservation.eventId,
      quantity: reservation.quantity,
      unitPriceInCents: reservation.unitPriceInCents,
      totalInCents: reservation.totalInCents,
      currency: reservation.currency,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      event: {
        ...presentedEvent,
        coverUrl: await this.images.createReadUrl(coverObjectKey),
      },
    };
  }
}
