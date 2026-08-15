export type TicketStatus = 'VALID' | 'USED';
export type GateValidationResult =
  | 'VALID'
  | 'INVALID'
  | 'ALREADY_USED'
  | 'WRONG_EVENT'
  | 'OUTSIDE_ADMISSION_WINDOW';
