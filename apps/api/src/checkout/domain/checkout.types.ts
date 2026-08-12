export const MAX_QUANTITY_PER_RESERVATION = 10;

export type ReservationStatus =
  'PENDING_PAYMENT' | 'PAID' | 'PAYMENT_REFUSED' | 'EXPIRED';
export type PaymentOutcome = 'APPROVED' | 'REFUSED';

export interface ReservationRecord {
  id: string;
  eventId: string;
  customerId: string;
  quantity: number;
  unitPriceInCents: number;
  totalInCents: number;
  currency: 'BRL';
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationEventSummary {
  id: string;
  slug: string;
  title: string;
  startsAt: Date;
  venue: string;
  city: string;
  coverObjectKey: string;
}

export interface ReservationDetail extends ReservationRecord {
  event: ReservationEventSummary;
}

export interface PaymentRecord {
  id: string;
  reservationId: string;
  customerId: string;
  amountInCents: number;
  currency: 'BRL';
  status: PaymentOutcome;
  idempotencyKey: string;
  createdAt: Date;
  processedAt: Date;
}

export interface PaymentResult {
  payment: PaymentRecord;
  reservation: ReservationRecord;
}

export interface PublishedEventDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  sourceReleaseDate: string | null;
  sourceImageUrl: string | null;
  startsAt: Date;
  venue: string;
  city: string;
  capacity: number;
  priceInCents: number;
  currency: 'BRL';
  coverObjectKey: string;
  coverContentType: string;
  availableQuantity: number;
  maxQuantityPerReservation: number;
}
