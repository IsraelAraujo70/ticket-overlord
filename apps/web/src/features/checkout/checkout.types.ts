export type ReservationStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PAYMENT_REFUSED"
  | "EXPIRED";

export interface PublishedEventDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  startsAt: string;
  venue: string;
  city: string;
  priceInCents: number;
  currency: "BRL";
  coverUrl: string;
  availableQuantity: number;
  maxQuantityPerReservation: number;
}

export interface ReservationEventSummary {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  venue: string;
  city: string;
}

export interface Reservation {
  id: string;
  eventId: string;
  quantity: number;
  unitPriceInCents: number;
  totalInCents: number;
  currency: "BRL";
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  event: ReservationEventSummary;
}

export interface Payment {
  id: string;
  reservationId: string;
  amountInCents: number;
  currency: "BRL";
  status: "APPROVED" | "REFUSED";
  processedAt: string;
}

export interface PaymentResponse {
  payment: Payment;
  reservation: Reservation;
}

export interface CheckoutActionState {
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
  outcome?: "APPROVED" | "REFUSED";
}

export const initialCheckoutActionState: CheckoutActionState = { status: "idle" };
