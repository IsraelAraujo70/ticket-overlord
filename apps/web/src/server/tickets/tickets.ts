import "server-only";

import { getSessionToken } from "@/server/auth/session";
import { backendRequest } from "@/server/backend-client";
import type { GateEvent, SharedTicket, Ticket } from "@/features/tickets/ticket.types";

async function authenticatedRequest<T>(path: string): Promise<T> {
  const token = await getSessionToken();
  if (!token) throw new Error("Authentication required.");
  return backendRequest<T>(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getTickets(): Promise<Ticket[]> {
  return authenticatedRequest("/tickets");
}

export function getTicket(ticketId: string): Promise<Ticket> {
  return authenticatedRequest(`/tickets/${encodeURIComponent(ticketId)}`);
}

export function getSharedTicket(token: string): Promise<SharedTicket> {
  return backendRequest(`/shared-tickets/${encodeURIComponent(token)}`);
}

export function getGateEvents(): Promise<GateEvent[]> {
  return authenticatedRequest("/gate/events");
}
