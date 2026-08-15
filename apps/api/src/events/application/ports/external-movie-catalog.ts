import type { ExternalMovie } from '../models/event.models';

export abstract class ExternalMovieCatalog {
  abstract search(query: string): Promise<ExternalMovie[]>;
  abstract findById(externalId: string): Promise<ExternalMovie | null>;
}
