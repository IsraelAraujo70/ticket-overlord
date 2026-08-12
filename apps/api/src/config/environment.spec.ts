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
    });
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
