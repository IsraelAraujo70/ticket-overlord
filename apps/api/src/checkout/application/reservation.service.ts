import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { EventImageStorage } from '../../events/application/ports/event-image-storage';
import { CheckoutError } from '../domain/checkout.errors';
import { validateReservationQuantity } from '../domain/reservation';
import type {
  ReservationDetail,
  ReservationRecord,
} from '../domain/checkout.types';
import { CheckoutStore } from './ports/checkout-store';

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
    private readonly store: CheckoutStore,
    private readonly images: EventImageStorage,
  ) {}

  /** Creates a ten-minute inventory hold for an authenticated customer. */
  create(
    user: AuthenticatedUser,
    eventId: string,
    quantity: number,
  ): Promise<ReservationRecord> {
    const customerId = requireCustomer(user);
    validateReservationQuantity(quantity);
    return this.store.createReservation({ customerId, eventId, quantity });
  }

  /** Returns and opportunistically expires a reservation owned by the customer. */
  async find(
    user: AuthenticatedUser,
    reservationId: string,
  ): Promise<PresentedReservationDetail> {
    const customerId = requireCustomer(user);
    const reservation = await this.store.findReservation(
      customerId,
      reservationId,
    );
    if (!reservation) {
      throw new CheckoutError(
        'RESERVATION_NOT_FOUND',
        'Reserva não encontrada.',
      );
    }

    const { coverObjectKey, ...event } = reservation.event;
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
        ...event,
        coverUrl: await this.images.createReadUrl(coverObjectKey),
      },
    };
  }
}

/** Restricts checkout operations to customer accounts. */
export function requireCustomer(user: AuthenticatedUser): string {
  if (user.role !== 'CUSTOMER') {
    throw new CheckoutError(
      'CUSTOMER_REQUIRED',
      'Somente clientes podem realizar reservas e pagamentos.',
    );
  }
  return user.id;
}
