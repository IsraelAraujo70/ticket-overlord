import "server-only";

import { backendRequest } from "@/server/backend-client";
import { getSessionToken } from "@/server/auth/session";
import type { AdminEvent } from "@/features/events/event.types";

async function authenticatedHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();

  if (!token) {
    throw new Error("Authentication required.");
  }

  return { Authorization: `Bearer ${token}` };
}

export async function listOrganizerEvents(): Promise<AdminEvent[]> {
  return backendRequest<AdminEvent[]>("/events", {
    headers: await authenticatedHeaders(),
  });
}

export async function listPublishedEvents(): Promise<AdminEvent[]> {
  return backendRequest<AdminEvent[]>("/events/published");
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
