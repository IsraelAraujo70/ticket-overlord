import type { ExternalMovie } from '../../domain/event.types';

export abstract class ExternalMovieCatalog {
  abstract search(query: string): Promise<ExternalMovie[]>;
  abstract findById(externalId: string): Promise<ExternalMovie | null>;
}
