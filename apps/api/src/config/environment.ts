import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
  validateSync,
} from 'class-validator';

export type AppEnvironment = 'local' | 'test' | 'production';
export type EmailProvider = 'console' | 'resend';

export class EnvironmentVariables {
  @IsIn(['local', 'test', 'production'])
  APP_ENV: AppEnvironment = 'local';

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsUrl({ require_tld: false, protocols: ['redis', 'rediss'] })
  REDIS_URL!: string;

  @IsIn(['console', 'resend'])
  EMAIL_PROVIDER: EmailProvider = 'console';

  @IsInt()
  @Min(1)
  @Max(65_535)
  @Type(() => Number)
  PORT = 3001;

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.EMAIL_PROVIDER === 'resend',
  )
  @IsString()
  @IsNotEmpty()
  RESEND_API_KEY?: string;

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.EMAIL_PROVIDER === 'resend',
  )
  @IsString()
  @IsNotEmpty()
  RESEND_FROM_EMAIL?: string;

  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  WEB_BASE_URL = 'http://localhost:3000';

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.APP_ENV === 'production' ||
      environment.TMDB_READ_ACCESS_TOKEN !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  TMDB_READ_ACCESS_TOKEN?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  S3_ENDPOINT_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  S3_PUBLIC_ENDPOINT_URL?: string;

  @IsString()
  @IsNotEmpty()
  S3_BUCKET = 'ticket-overlord-events';

  @IsString()
  @IsNotEmpty()
  S3_REGION = 'us-east-1';

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.S3_ACCESS_KEY_ID !== undefined ||
      environment.S3_SECRET_ACCESS_KEY !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  S3_ACCESS_KEY_ID?: string;

  @ValidateIf(
    (environment: EnvironmentVariables) =>
      environment.S3_ACCESS_KEY_ID !== undefined ||
      environment.S3_SECRET_ACCESS_KEY !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  S3_SECRET_ACCESS_KEY?: string;

  @IsIn(['true', 'false'])
  S3_FORCE_PATH_STYLE = 'true';

  @IsInt()
  @Min(60)
  @Max(3600)
  @Type(() => Number)
  S3_PRESIGNED_URL_TTL_SECONDS = 900;
}

export function validateEnvironment(
  values: Record<string, unknown>,
): EnvironmentVariables {
  const appEnvironment =
    values.APP_ENV ??
    (values.NODE_ENV === 'production' ? 'production' : 'local');
  const isProduction = appEnvironment === 'production';
  const environment = plainToInstance(
    EnvironmentVariables,
    {
      ...values,
      APP_ENV: appEnvironment,
      EMAIL_PROVIDER:
        values.EMAIL_PROVIDER ?? (isProduction ? 'resend' : 'console'),
      PORT: values.PORT ?? 3001,
      REDIS_URL:
        values.REDIS_URL ??
        (isProduction ? undefined : 'redis://localhost:6379'),
      WEB_BASE_URL: values.WEB_BASE_URL ?? 'http://localhost:3000',
      S3_ENDPOINT_URL:
        values.S3_ENDPOINT_URL ??
        (isProduction ? undefined : 'http://localhost:9000'),
      S3_PUBLIC_ENDPOINT_URL:
        values.S3_PUBLIC_ENDPOINT_URL ??
        (isProduction ? undefined : 'http://localhost:9000'),
      S3_BUCKET: values.S3_BUCKET ?? 'ticket-overlord-events',
      S3_REGION: values.S3_REGION ?? 'us-east-1',
      S3_ACCESS_KEY_ID:
        values.S3_ACCESS_KEY_ID ??
        (isProduction ? undefined : 'ticket_overlord'),
      S3_SECRET_ACCESS_KEY:
        values.S3_SECRET_ACCESS_KEY ??
        (isProduction ? undefined : 'ticket_overlord_secret'),
      S3_FORCE_PATH_STYLE:
        values.S3_FORCE_PATH_STYLE ?? (isProduction ? 'false' : 'true'),
      S3_PRESIGNED_URL_TTL_SECONDS: values.S3_PRESIGNED_URL_TTL_SECONDS ?? 900,
    },
    { enableImplicitConversion: true },
  );
  const errors = validateSync(environment, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return environment;
}
