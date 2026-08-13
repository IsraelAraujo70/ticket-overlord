import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { EventError } from '../domain/event.errors';
import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_TYPES,
  type EventImageType,
  type EventRecord,
  type PresentedEvent,
} from '../domain/event.types';
import { EventImageStorage } from './ports/event-image-storage';
import { EventStore } from './ports/event-store';
import { ExternalMovieCatalog } from './ports/external-movie-catalog';

export interface CreateEventCommand {
  category: string;
  externalId?: string;
  title?: string;
  summary?: string;
  startsAt: string;
  venue: string;
  city: string;
  capacity: number;
  priceInCents: number;
  cover: Buffer;
}

@Injectable()
export class CreateEventService {
  constructor(
    private readonly catalog: ExternalMovieCatalog,
    private readonly store: EventStore,
    private readonly images: EventImageStorage,
  ) {}

  async create(
    user: AuthenticatedUser,
    command: CreateEventCommand,
  ): Promise<PresentedEvent> {
    const organizationId = organizerOrganization(user);
    const startsAt = new Date(command.startsAt);

    if (!Number.isFinite(startsAt.getTime()) || startsAt <= new Date()) {
      throw new EventError(
        'INVALID_EVENT_DATE',
        'A data do evento deve estar no futuro.',
      );
    }

    const image = validateImage(command.cover);
    const details = await this.resolveEventDetails(command);

    const id = randomUUID();
    const extension = image.mime === 'image/jpeg' ? 'jpg' : image.ext;
    const coverObjectKey = `organizations/${organizationId}/events/${id}/cover.${extension}`;
    const slug = `${slugify(details.title)}-${id.slice(0, 8)}`;

    await this.images.store({
      key: coverObjectKey,
      body: command.cover,
      contentType: image.mime,
    });

    try {
      const event = await this.store.create({
        id,
        organizationId,
        externalSource: details.externalSource,
        externalId: details.externalId,
        slug,
        title: details.title,
        summary: details.summary,
        category: details.category,
        sourceReleaseDate: details.sourceReleaseDate,
        sourceImageUrl: details.sourceImageUrl,
        startsAt,
        venue: command.venue,
        city: command.city,
        capacity: command.capacity,
        priceInCents: command.priceInCents,
        currency: 'BRL',
        coverObjectKey,
        coverContentType: image.mime,
        status: 'DRAFT',
      });

      return presentEvent(event, this.images);
    } catch (error) {
      try {
        await this.images.delete(coverObjectKey);
      } catch {
        // The persistence error remains the primary failure for the request.
      }
      throw error;
    }
  }

  private async resolveEventDetails(command: CreateEventCommand) {
    const category = command.category.trim();

    if (category.toLocaleLowerCase('pt-BR') === 'cinema') {
      if (!command.externalId) {
        throw new EventError(
          'EXTERNAL_MOVIE_REQUIRED',
          'Selecione um filme do TMDb para eventos de cinema.',
        );
      }

      const movie = await this.catalog.findById(command.externalId);

      if (!movie) {
        throw new EventError(
          'EXTERNAL_MOVIE_NOT_FOUND',
          'O filme selecionado não foi encontrado no TMDb.',
        );
      }

      return {
        externalSource: 'TMDB' as const,
        externalId: movie.externalId,
        title: movie.title,
        summary: movie.summary,
        category: 'Cinema',
        sourceReleaseDate: movie.releaseDate,
        sourceImageUrl: movie.imageUrl,
      };
    }

    const title = command.title?.trim();
    const summary = command.summary?.trim();

    if (category.length < 2 || !title || !summary) {
      throw new EventError(
        'MANUAL_EVENT_DETAILS_REQUIRED',
        'Informe categoria, título e descrição para criar o evento.',
      );
    }

    return {
      externalSource: null,
      externalId: null,
      title,
      summary,
      category,
      sourceReleaseDate: null,
      sourceImageUrl: null,
    };
  }
}

/** Ensures event mutations always belong to an organizer organization. */
export function organizerOrganization(user: AuthenticatedUser): string {
  if (user.role !== 'ORGANIZER') {
    throw new EventError(
      'ORGANIZER_REQUIRED',
      'Somente organizadores podem gerenciar eventos.',
    );
  }

  if (!user.organizationId) {
    throw new EventError(
      'ORGANIZATION_REQUIRED',
      'A conta precisa estar vinculada a uma organização.',
    );
  }

  return user.organizationId;
}

/** Converts a stored object key into a response with a short-lived read URL. */
export async function presentEvent(
  event: EventRecord,
  images: EventImageStorage,
): Promise<PresentedEvent> {
  const { coverObjectKey, ...stored } = event;
  return {
    ...stored,
    coverUrl: await images.createReadUrl(coverObjectKey),
  };
}

function validateImage(buffer: Buffer): {
  ext: string;
  mime: EventImageType;
} {
  if (buffer.length > EVENT_IMAGE_MAX_BYTES) {
    throw new EventError(
      'EVENT_IMAGE_TOO_LARGE',
      'A capa deve ter no máximo 5 MiB.',
    );
  }

  const detected = detectEventImage(buffer);

  if (!detected || !EVENT_IMAGE_TYPES.includes(detected.mime)) {
    throw new EventError(
      'INVALID_EVENT_IMAGE',
      'Envie uma imagem JPEG, PNG ou WebP válida.',
    );
  }

  return {
    ext: detected.ext,
    mime: detected.mime,
  };
}

/** Detects the three accepted cover formats from their binary signatures. */
function detectEventImage(
  buffer: Buffer,
): { ext: string; mime: EventImageType } | null {
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  if (buffer.subarray(0, pngSignature.length).equals(pngSignature)) {
    return { ext: 'png', mime: 'image/png' };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }

  return null;
}

function slugify(value: string): string {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);

  return slug || 'evento';
}
