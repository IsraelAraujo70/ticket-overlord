import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { ConsoleEmailSender } from './email/console-email-sender';
import { EMAIL_SENDER, type EmailSender } from './email/email-sender';
import { ResendEmailSender } from './email/resend-email-sender';
import { PasswordHasher } from './security/password-hasher';
import { TokenService } from './security/token-service';

function createEmailSender(): EmailSender {
  const provider = process.env.EMAIL_PROVIDER ?? 'console';
  const isProduction =
    process.env.APP_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && process.env.APP_ENV !== 'local');
  const baseUrl = (process.env.WEB_BASE_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );

  if (isProduction && provider !== 'resend') {
    throw new Error('EMAIL_PROVIDER must be resend in production.');
  }

  if (provider === 'console' && !isProduction) {
    return new ConsoleEmailSender(baseUrl);
  }

  if (provider !== 'resend') {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error(
      'RESEND_API_KEY and RESEND_FROM_EMAIL must be set for the Resend provider.',
    );
  }

  return new ResendEmailSender(apiKey, from, baseUrl);
}

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    PasswordHasher,
    TokenService,
    { provide: EMAIL_SENDER, useFactory: createEmailSender },
  ],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
