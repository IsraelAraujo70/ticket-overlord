import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { BackfillSearchEmbeddingsService } from './application/backfill-search-embeddings.service';
import { EmbeddingProvider } from './application/ports/embedding-provider';
import {
  PublishedEventSearchReader,
  SearchEmbeddingIndexStore,
} from './application/ports/published-event-search';
import { SearchEventsService } from './application/search-events.service';
import { OpenRouterEmbeddingProvider } from './infrastructure/embeddings/openrouter-embedding-provider';
import { PostgresPublishedEventSearch } from './infrastructure/persistence/postgres-published-event-search';
import { SearchController } from './presentation/search.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, EventsModule],
  controllers: [SearchController],
  providers: [
    SearchEventsService,
    BackfillSearchEmbeddingsService,
    { provide: EmbeddingProvider, useClass: OpenRouterEmbeddingProvider },
    PostgresPublishedEventSearch,
    {
      provide: PublishedEventSearchReader,
      useExisting: PostgresPublishedEventSearch,
    },
    {
      provide: SearchEmbeddingIndexStore,
      useExisting: PostgresPublishedEventSearch,
    },
  ],
  exports: [BackfillSearchEmbeddingsService],
})
export class SearchModule {}
