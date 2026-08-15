import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { ExternalMovieCatalog } from './ports/external-movie-catalog';
import type { ExternalMovie } from './models/event.models';
import { organizerOrganization } from './event-access';

@Injectable()
export class SearchExternalMoviesService {
  constructor(private readonly catalog: ExternalMovieCatalog) {}

  search(user: AuthenticatedUser, query: string): Promise<ExternalMovie[]> {
    organizerOrganization(user);
    return this.catalog.search(query.trim());
  }
}
