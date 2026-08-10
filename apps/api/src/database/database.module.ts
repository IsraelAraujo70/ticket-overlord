import {
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { DATABASE, POSTGRES_POOL } from './database.constants';

@Injectable()
class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_POOL,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
          throw new Error('DATABASE_URL must be set to start the API.');
        }

        return new Pool({ connectionString });
      },
    },
    {
      provide: DATABASE,
      inject: [POSTGRES_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
    DatabaseLifecycle,
  ],
  exports: [DATABASE, POSTGRES_POOL],
})
export class DatabaseModule {}
