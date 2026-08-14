export interface CatalogEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  venue: string;
  dateLabel: string;
  startsAt: string;
  priceLabel: string;
  imageUrl: string;
  imageAlt: string;
  featured: boolean;
}

export interface CatalogSection {
  id: string;
  title: string;
  events: CatalogEvent[];
}

export interface CatalogResponse {
  highlights: CatalogEvent[];
  sections: CatalogSection[];
  meta: {
    query: string;
    total: number;
    page: number;
    pageSize: number;
    pages: number;
  };
}
