import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { TicketError } from '../domain/ticket.errors';
import type {
  GateEventView,
  GateValidationResult,
} from '../domain/ticket.types';
import { TicketStore } from './ports/ticket-store';

@Injectable()
export class GateService {
  constructor(private readonly store: TicketStore) {}

  events(user: AuthenticatedUser): Promise<GateEventView[]> {
    return this.store.listGateEvents(organizationId(user));
  }

  validate(
    user: AuthenticatedUser,
    eventId: string,
    code: string,
    now = new Date(),
  ): Promise<GateValidationResult> {
    organizationId(user);
    return this.store.validateAtGate({ operator: user, eventId, code, now });
  }
}

function organizationId(user: AuthenticatedUser): string {
  if (
    (user.role !== 'ORGANIZER' && user.role !== 'ORGANIZER_STAFF') ||
    !user.organizationId
  ) {
    throw new TicketError(
      'GATE_ACCESS_REQUIRED',
      'Acesso exclusivo para a equipe da organização.',
    );
  }
  return user.organizationId;
}
