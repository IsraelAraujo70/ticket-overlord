import 'reflect-metadata';
import { validateEnvironment } from './environment';

describe('environment validation', () => {
  it('applies safe local defaults', () => {
    const environment = validateEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
    });

    expect(environment).toMatchObject({
      APP_ENV: 'local',
      EMAIL_PROVIDER: 'console',
      PORT: 3001,
      REDIS_URL: 'redis://localhost:6379',
      WEB_BASE_URL: 'http://localhost:3000',
      S3_BUCKET: 'ticket-overlord-events',
      S3_ENDPOINT_URL: 'http://localhost:9000',
      S3_FORCE_PATH_STYLE: 'true',
      OPENROUTER_EMBEDDING_MODEL: 'openai/text-embedding-3-small',
    });
  });

  it('keeps semantic search optional when the example key is empty', () => {
    const environment = validateEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
      OPENROUTER_API_KEY: '',
    });

    expect(environment.OPENROUTER_API_KEY).toBeUndefined();
  });

  it('parses numeric values supplied by process environment variables', () => {
    const environment = validateEnvironment({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
      PORT: '3011',
      S3_PRESIGNED_URL_TTL_SECONDS: '600',
    });

    expect(environment.PORT).toBe(3011);
    expect(environment.S3_PRESIGNED_URL_TTL_SECONDS).toBe(600);
  });

  it('requires Resend credentials when that provider is selected', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
        EMAIL_PROVIDER: 'resend',
      }),
    ).toThrow('Invalid environment configuration');
  });

  it('requires the TMDb token in production', () => {
    expect(() =>
      validateEnvironment({
        APP_ENV: 'production',
        DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test',
        RESEND_FROM_EMAIL: 'Ticket Overlord <test@example.com>',
      }),
    ).toThrow('Invalid environment configuration');
  });

  it('fails closed when NODE_ENV is production and APP_ENV is omitted', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
      }),
    ).toThrow('Invalid environment configuration');
  });

  it('uses native AWS S3 resolution in production', () => {
    const environment = validateEnvironment({
      APP_ENV: 'production',
      DATABASE_URL: 'postgresql://user:password@localhost:5432/database',
      EMAIL_PROVIDER: 'resend',
      RESEND_API_KEY: 're_test',
      RESEND_FROM_EMAIL: 'Ticket Overlord <test@example.com>',
      TMDB_READ_ACCESS_TOKEN: 'tmdb-token',
      REDIS_URL: 'rediss://redis.example.com:6379',
    });

    expect(environment).toMatchObject({
      S3_FORCE_PATH_STYLE: 'false',
      S3_REGION: 'us-east-1',
    });
    expect(environment.S3_ENDPOINT_URL).toBeUndefined();
    expect(environment.S3_PUBLIC_ENDPOINT_URL).toBeUndefined();
    expect(environment.S3_ACCESS_KEY_ID).toBeUndefined();
    expect(environment.S3_SECRET_ACCESS_KEY).toBeUndefined();
  });
});
