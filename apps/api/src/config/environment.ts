import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
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

  @IsIn(['console', 'resend'])
  EMAIL_PROVIDER: EmailProvider = 'console';

  @IsInt()
  @Min(1)
  @Max(65_535)
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
}

export function validateEnvironment(
  values: Record<string, unknown>,
): EnvironmentVariables {
  const environment = plainToInstance(
    EnvironmentVariables,
    {
      ...values,
      APP_ENV: values.APP_ENV ?? 'local',
      EMAIL_PROVIDER: values.EMAIL_PROVIDER ?? 'console',
      PORT: values.PORT ?? 3001,
      WEB_BASE_URL: values.WEB_BASE_URL ?? 'http://localhost:3000',
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
