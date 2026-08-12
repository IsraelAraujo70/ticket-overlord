export type TicketErrorCode =
  | 'CUSTOMER_REQUIRED'
  | 'GATE_ACCESS_REQUIRED'
  | 'TICKET_NOT_FOUND'
  | 'EVENT_NOT_FOUND';

export class TicketError extends Error {
  constructor(
    readonly code: TicketErrorCode,
    message: string,
  ) {
    super(message);
  }
}
