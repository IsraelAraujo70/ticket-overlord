import type {
  EventStatus,
  ExternalCatalogSource,
} from '../../domain/event.types';

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
