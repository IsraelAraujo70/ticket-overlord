import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { TicketError } from '../domain/ticket.errors';
import type { SharedTicketView, TicketView } from '../domain/ticket.types';
import { TicketStore } from './ports/ticket-store';

@Injectable()
export class TicketQueryService {
  constructor(private readonly store: TicketStore) {}

  list(user: AuthenticatedUser): Promise<TicketView[]> {
    ensureCustomer(user);
    return this.store.listForCustomer(user.id);
  }

  async find(user: AuthenticatedUser, ticketId: string): Promise<TicketView> {
    ensureCustomer(user);
    const ticket = await this.store.findForCustomer(user.id, ticketId);
    if (!ticket)
      throw new TicketError('TICKET_NOT_FOUND', 'Ingresso não encontrado.');
    return ticket;
  }

  async shared(token: string): Promise<SharedTicketView> {
    const ticket = await this.store.findShared(token);
    if (!ticket)
      throw new TicketError('TICKET_NOT_FOUND', 'Ingresso não encontrado.');
    return ticket;
  }
}

function ensureCustomer(user: AuthenticatedUser): void {
  if (user.role !== 'CUSTOMER') {
    throw new TicketError(
      'CUSTOMER_REQUIRED',
      'Acesso exclusivo para clientes.',
    );
  }
}
