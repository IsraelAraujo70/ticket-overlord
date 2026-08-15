import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { CreateEventService } from './application/create-event.service';
import { ListEventsService } from './application/list-events.service';
import { PublishEventService } from './application/publish-event.service';
import { EventImageStorage } from './application/ports/event-image-storage';
import {
  EventCatalogReader,
  EventDraftWriter,
  EventPublisher,
} from './application/ports/event-store';
import { ExternalMovieCatalog } from './application/ports/external-movie-catalog';
import { SearchExternalMoviesService } from './application/search-external-movies.service';
import { TmdbMovieCatalog } from './infrastructure/catalog/tmdb-movie-catalog';
import { DrizzleEventStore } from './infrastructure/persistence/drizzle-event-store';
import { S3EventImageStorage } from './infrastructure/storage/s3-event-image-storage';
import { EventExceptionFilter } from './presentation/event-exception.filter';
import { EventsController } from './presentation/events.controller';
import { ExternalCatalogController } from './presentation/external-catalog.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, RateLimitModule],
  controllers: [EventsController, ExternalCatalogController],
  providers: [
    CreateEventService,
    ListEventsService,
    PublishEventService,
    SearchExternalMoviesService,
    EventExceptionFilter,
    { provide: ExternalMovieCatalog, useClass: TmdbMovieCatalog },
    DrizzleEventStore,
    { provide: EventDraftWriter, useExisting: DrizzleEventStore },
    { provide: EventPublisher, useExisting: DrizzleEventStore },
    { provide: EventCatalogReader, useExisting: DrizzleEventStore },
    { provide: EventImageStorage, useClass: S3EventImageStorage },
  ],
  exports: [EventImageStorage],
})
export class EventsModule {}
