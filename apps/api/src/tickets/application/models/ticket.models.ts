import type { TicketStatus } from '../../domain/ticket.types';

export interface TicketView {
  id: string;
  reservationId: string;
  eventId: string;
  sequence: number;
  manualCode: string;
  qrCode: string;
  shareToken: string;
  status: TicketStatus;
  usedAt: Date | null;
  createdAt: Date;
  event: {
    title: string;
    startsAt: Date;
    venue: string;
    city: string;
  };
}

export interface SharedTicketView extends Omit<TicketView, 'shareToken'> {
  customerName: string;
}

export interface GateEventView {
  id: string;
  title: string;
  startsAt: Date;
  venue: string;
  city: string;
}
