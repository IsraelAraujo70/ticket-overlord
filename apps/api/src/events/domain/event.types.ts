export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const EVENT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type EventImageType = (typeof EVENT_IMAGE_TYPES)[number];
export type EventStatus = 'DRAFT' | 'PUBLISHED';
export type ExternalCatalogSource = 'TMDB' | null;

export interface ExternalMovie {
  externalId: string;
  title: string;
  summary: string;
  releaseDate: string | null;
  imageUrl: string | null;
}

export interface EventRecord {
  id: string;
  organizationId: string;
  externalSource: ExternalCatalogSource;
  externalId: string | null;
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
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresentedEvent extends Omit<EventRecord, 'coverObjectKey'> {
  coverUrl: string;
}
