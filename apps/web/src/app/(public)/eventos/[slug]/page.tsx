import { notFound } from "next/navigation";
import { EventDetailExperience } from "@/components/organisms/event-detail-experience";
import type { PublishedEventDetail } from "@/features/checkout/checkout.types";
import { getCurrentUser } from "@/server/auth/session";
import { BackendRequestError } from "@/server/backend-client";
import { getPublishedEvent } from "@/server/checkout/checkout";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let event: PublishedEventDetail;

  try {
    event = await getPublishedEvent(slug);
  } catch (error) {
    if (error instanceof BackendRequestError && error.status === 404) notFound();
    throw error;
  }

  return <EventDetailExperience event={event} user={await getCurrentUser()} />;
}
