export type EventErrorCode =
  | 'ORGANIZER_REQUIRED'
  | 'ORGANIZATION_REQUIRED'
  | 'INVALID_EVENT_DATE'
  | 'INVALID_EVENT_IMAGE'
  | 'EVENT_IMAGE_TOO_LARGE'
  | 'EXTERNAL_MOVIE_NOT_FOUND'
  | 'EXTERNAL_CATALOG_NOT_CONFIGURED'
  | 'EXTERNAL_CATALOG_UNAVAILABLE'
  | 'EVENT_NOT_FOUND';

export class EventError extends Error {
  constructor(
    readonly code: EventErrorCode,
    message: string,
  ) {
    super(message);
  }
}
