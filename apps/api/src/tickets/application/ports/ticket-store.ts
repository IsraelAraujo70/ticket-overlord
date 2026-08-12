import type { PoolClient } from 'pg';
import type { AuthenticatedUser } from '../../../auth/domain/auth.types';
import type {
  GateEventView,
  GateValidationResult,
  SharedTicketView,
  TicketView,
} from '../../domain/ticket.types';

export interface IssuedTicketSecret {
  id: string;
  shareToken: string;
}

export abstract class TicketStore {
  abstract issueForPaidReservation(
    client: PoolClient,
    input: {
      reservationId: string;
      eventId: string;
      customerId: string;
      quantity: number;
    },
  ): Promise<IssuedTicketSecret[]>;
  abstract listForCustomer(customerId: string): Promise<TicketView[]>;
  abstract findForCustomer(
    customerId: string,
    ticketId: string,
  ): Promise<TicketView | null>;
  abstract findShared(token: string): Promise<SharedTicketView | null>;
  abstract listGateEvents(organizationId: string): Promise<GateEventView[]>;
  abstract validateAtGate(input: {
    operator: AuthenticatedUser;
    eventId: string;
    code: string;
    now: Date;
  }): Promise<GateValidationResult>;
}
