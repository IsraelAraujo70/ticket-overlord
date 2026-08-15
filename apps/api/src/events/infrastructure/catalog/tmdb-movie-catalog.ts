import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalMovieCatalog } from '../../application/ports/external-movie-catalog';
import { EventError } from '../../domain/event.errors';
import type { ExternalMovie } from '../../application/models/event.models';

interface TmdbMovie {
  id: number;
  title?: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
}

interface TmdbSearchResponse {
  results?: TmdbMovie[];
}

@Injectable()
export class TmdbMovieCatalog extends ExternalMovieCatalog {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async search(query: string): Promise<ExternalMovie[]> {
    const response = await this.request<TmdbSearchResponse>('/search/movie', {
      query,
      include_adult: 'false',
      language: 'pt-BR',
      page: '1',
    });
    return (response.results ?? [])
      .slice(0, 12)
      .map(normalizeMovie)
      .filter((movie): movie is ExternalMovie => movie !== null);
  }

  async findById(externalId: string): Promise<ExternalMovie | null> {
    try {
      const movie = await this.request<TmdbMovie>(
        `/movie/${encodeURIComponent(externalId)}`,
        { language: 'pt-BR' },
      );
      return normalizeMovie(movie);
    } catch (error) {
      if (error instanceof TmdbNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  private async request<T>(
    path: string,
    query: Record<string, string>,
  ): Promise<T> {
    const token = this.config.get<string>('TMDB_READ_ACCESS_TOKEN');

    if (!token) {
      throw new EventError(
        'EXTERNAL_CATALOG_NOT_CONFIGURED',
        'Configure o token do TMDb para buscar o catálogo externo.',
      );
    }

    const url = new URL(`https://api.themoviedb.org/3${path}`);
    Object.entries(query).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new EventError(
        'EXTERNAL_CATALOG_UNAVAILABLE',
        'O catálogo do TMDb não está disponível no momento.',
      );
    }

    if (response.status === 404) {
      throw new TmdbNotFoundError();
    }

    if (!response.ok) {
      throw new EventError(
        'EXTERNAL_CATALOG_UNAVAILABLE',
        'O catálogo do TMDb não está disponível no momento.',
      );
    }

    return (await response.json()) as T;
  }
}

class TmdbNotFoundError extends Error {}

function normalizeMovie(movie: TmdbMovie): ExternalMovie | null {
  const title = movie.title?.trim();

  if (!Number.isInteger(movie.id) || !title) {
    return null;
  }

  return {
    externalId: String(movie.id),
    title,
    summary: movie.overview?.trim() || 'Sinopse não disponível no TMDb.',
    releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(movie.release_date ?? '')
      ? (movie.release_date ?? null)
      : null,
    imageUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null,
  };
}
