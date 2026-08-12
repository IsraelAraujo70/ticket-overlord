export type TicketStatus = "VALID" | "USED";

export interface TicketEvent {
  title: string;
  startsAt: string;
  venue: string;
  city: string;
}

export interface Ticket {
  id: string;
  reservationId: string;
  eventId: string;
  sequence: number;
  manualCode: string;
  qrCode: string;
  shareToken: string;
  status: TicketStatus;
  usedAt: string | null;
  createdAt: string;
  event: TicketEvent;
}

export interface SharedTicket extends Omit<Ticket, "shareToken"> {
  customerName: string;
}

export interface GateEvent {
  id: string;
  title: string;
  startsAt: string;
  venue: string;
  city: string;
}

export type GateValidationResult =
  | "VALID"
  | "INVALID"
  | "ALREADY_USED"
  | "WRONG_EVENT"
  | "OUTSIDE_ADMISSION_WINDOW";

export interface GateActionState {
  status: "idle" | "success" | "error";
  result?: GateValidationResult;
  message?: string;
}

export const initialGateActionState: GateActionState = { status: "idle" };
