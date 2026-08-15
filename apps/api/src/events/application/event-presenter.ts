import type { EventRecord, PresentedEvent } from './models/event.models';
import type { EventImageStorage } from './ports/event-image-storage';

/** Converts a stored object key into a response with a short-lived read URL. */
export async function presentEvent(
  event: EventRecord,
  images: EventImageStorage,
): Promise<PresentedEvent> {
  const { coverObjectKey, ...stored } = event;
  return {
    ...stored,
    coverUrl: await images.createReadUrl(coverObjectKey),
  };
}
