import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import type { PaymentOutcome } from '../domain/checkout.types';
import { CheckoutError } from '../domain/checkout.errors';
import type { PaymentResult } from './models/checkout.models';
import { requireCustomer } from './customer-access';
import {
  InventorySnapshotReader,
  PaymentConfirmationStore,
} from './ports/confirmed-checkout-store';
import { PaymentHoldStore } from './ports/inventory-hold-store';
import { PaymentGateway } from './ports/payment-gateway';

@Injectable()
export class PaymentService {
  constructor(
    private readonly store: PaymentConfirmationStore,
    private readonly inventory: InventorySnapshotReader,
    private readonly holds: PaymentHoldStore,
    private readonly gateway: PaymentGateway,
  ) {}

  /** Processes or replays one idempotent simulated payment attempt. */
  async process(
    user: AuthenticatedUser,
    reservationId: string,
    idempotencyKey: string,
    requestedOutcome: PaymentOutcome,
  ): Promise<PaymentResult> {
    const customerId = requireCustomer(user);
    const outcome = await this.gateway.process(requestedOutcome);
    const idempotent = await this.store.findPaymentResultByIdempotencyKey(
      customerId,
      idempotencyKey,
    );
    if (idempotent && idempotent.reservation.id !== reservationId) {
      throw new CheckoutError(
        'IDEMPOTENCY_CONFLICT',
        'A chave de idempotência já foi usada com outros parâmetros.',
      );
    }
    const durable = await this.store.findPaymentResult(reservationId);
    if (durable) {
      if (
        durable.reservation.customerId !== customerId ||
        durable.payment.idempotencyKey !== idempotencyKey ||
        outcome !== 'APPROVED'
      ) {
        throw new CheckoutError(
          'IDEMPOTENCY_CONFLICT',
          'A chave de idempotência já foi usada com outros parâmetros.',
        );
      }
      try {
        const hold = await this.holds.prepare({
          customerId,
          reservationId,
          idempotencyKey,
          outcome,
        });
        const snapshot = await this.inventory.inventorySnapshot(hold.eventId);
        await this.holds.confirm(hold, snapshot.confirmedQuantity);
      } catch (error) {
        if (
          !(error instanceof CheckoutError) ||
          error.code !== 'RESERVATION_NOT_FOUND'
        ) {
          throw error;
        }
      }
      return durable;
    }
    const hold = await this.holds.prepare({
      customerId,
      reservationId,
      idempotencyKey,
      outcome,
    });
    if (outcome === 'REFUSED') {
      await this.holds.release(hold);
      return {
        reservation: {
          ...hold,
          status: 'PAYMENT_REFUSED',
          updatedAt: hold.updatedAt,
        },
        payment: {
          id: hold.id,
          reservationId,
          customerId,
          amountInCents: hold.totalInCents,
          currency: hold.currency,
          status: 'REFUSED',
          idempotencyKey,
          createdAt: hold.updatedAt,
          processedAt: hold.updatedAt,
        },
      };
    }
    const confirmed = await this.store.confirm(hold, () =>
      this.holds.validate(hold),
    );
    await this.holds.confirm(hold, confirmed.confirmedQuantity);
    return confirmed.result;
  }
}
