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
      WEB_BASE_URL: 'http://localhost:3000',
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
});
