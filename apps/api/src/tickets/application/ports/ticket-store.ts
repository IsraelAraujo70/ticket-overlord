import type { AuthenticatedUser } from '../../../auth/domain/auth.types';
import type {
  GateEventView,
  SharedTicketView,
  TicketView,
} from '../models/ticket.models';
import type { GateValidationResult } from '../../domain/ticket.types';

export abstract class CustomerTicketReader {
  abstract listForCustomer(customerId: string): Promise<TicketView[]>;
  abstract findForCustomer(
    customerId: string,
    ticketId: string,
  ): Promise<TicketView | null>;
  abstract findShared(token: string): Promise<SharedTicketView | null>;
}

export abstract class GateTicketStore {
  abstract listGateEvents(organizationId: string): Promise<GateEventView[]>;
  abstract validateAtGate(input: {
    operator: AuthenticatedUser;
    eventId: string;
    code: string;
    now: Date;
  }): Promise<GateValidationResult>;
}
