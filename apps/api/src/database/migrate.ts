import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be set to run migrations.');
}

const pool = new Pool({ connectionString });

async function run(): Promise<void> {
  await migrate(drizzle(pool), {
    migrationsFolder: resolve(__dirname, '../../../drizzle'),
  });
  console.log('Database migrations applied successfully.');
}

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
