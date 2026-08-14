import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BackfillSearchEmbeddingsService } from './application/backfill-search-embeddings.service';

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const result = await app.get(BackfillSearchEmbeddingsService).run();
    console.log(
      `Search backfill completed: ${result.scanned} scanned, ${result.indexed} indexed, ${result.skipped} unchanged.`,
    );
  } finally {
    await app.close();
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
