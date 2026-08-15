export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const EVENT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type EventImageType = (typeof EVENT_IMAGE_TYPES)[number];
export type EventStatus = 'DRAFT' | 'PUBLISHED';
export type ExternalCatalogSource = 'TMDB' | null;
