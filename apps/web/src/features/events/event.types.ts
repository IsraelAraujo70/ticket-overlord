export interface ExternalMovie {
  externalId: string;
  title: string;
  summary: string;
  releaseDate: string | null;
  imageUrl: string | null;
}

export interface AdminEvent {
  id: string;
  organizationId: string;
  externalSource: "TMDB";
  externalId: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  sourceReleaseDate: string | null;
  sourceImageUrl: string | null;
  startsAt: string;
  venue: string;
  city: string;
  capacity: number;
  priceInCents: number;
  currency: "BRL";
  coverContentType: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
  coverUrl: string;
}

export interface EventActionState {
  status: "idle" | "error";
  message?: string;
  code?: string;
}

export interface MovieSearchResult {
  movies: ExternalMovie[];
  error?: string;
}

export const initialEventActionState: EventActionState = { status: "idle" };
