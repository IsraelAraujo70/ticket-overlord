import "server-only";

import { getSessionToken } from "@/server/auth/session";
import { backendRequest } from "@/server/backend-client";
import type {
  PublishedEventDetail,
  Reservation,
} from "@/features/checkout/checkout.types";

export async function getPublishedEvent(slug: string): Promise<PublishedEventDetail> {
  const event = await backendRequest<PublishedEventDetail>(
    `/events/published/${encodeURIComponent(slug)}`,
  );
  return { ...event, coverUrl: `/api/event-covers/${event.id}` };
}

export async function getReservation(reservationId: string): Promise<Reservation> {
  const token = await getSessionToken();

  if (!token) {
    throw new Error("Authentication required.");
  }

  return backendRequest<Reservation>(
    `/reservations/${encodeURIComponent(reservationId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}
