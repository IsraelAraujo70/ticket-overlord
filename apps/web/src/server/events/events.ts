import "server-only";

import { backendRequest } from "@/server/backend-client";
import { getSessionToken } from "@/server/auth/session";
import type { AdminEvent } from "@/features/events/event.types";

export interface EventPage {
  items: AdminEvent[];
  total: number;
  page: number;
  pageSize: number;
}

async function authenticatedHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();

  if (!token) {
    throw new Error("Authentication required.");
  }

  return { Authorization: `Bearer ${token}` };
}

export async function listOrganizerEvents(page = 1, search = ""): Promise<EventPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: "50" });
  if (search.trim()) params.set("search", search.trim().slice(0, 100));
  return backendRequest<EventPage>(`/events?${params.toString()}`, {
    headers: await authenticatedHeaders(),
  });
}

export async function listPublishedEvents(page = 1, search = ""): Promise<EventPage> {
  const params = new URLSearchParams({ page: String(page), pageSize: "48" });
  if (search.trim()) params.set("search", search.trim().slice(0, 100));
  return backendRequest<EventPage>(`/events/published?${params.toString()}`);
}

export async function organizerCoverUrl(eventId: string): Promise<string> {
  const result = await backendRequest<{ url: string }>(
    `/events/${encodeURIComponent(eventId)}/cover`,
    { headers: await authenticatedHeaders() },
  );
  return result.url;
}

export async function publishedCoverUrl(eventId: string): Promise<string> {
  const result = await backendRequest<{ url: string }>(
    `/events/published/${encodeURIComponent(eventId)}/cover`,
  );
  return result.url;
}
