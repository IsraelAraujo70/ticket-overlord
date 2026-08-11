import type { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMAIL_SENDER,
  type EmailSender,
} from '../../application/ports/email-sender';
import { ConsoleEmailSender } from './console-email-sender';
import { ResendEmailSender } from './resend-email-sender';

export interface EmailSenderConfiguration {
  appEnvironment: string;
  apiKey?: string;
  baseUrl: string;
  from?: string;
  provider: string;
}

export function createEmailSender(
  config: EmailSenderConfiguration,
): EmailSender {
  const baseUrl = config.baseUrl.replace(/\/$/, '');

  if (config.appEnvironment === 'production' && config.provider !== 'resend') {
    throw new Error('EMAIL_PROVIDER must be resend in production.');
  }

  if (config.provider === 'console' && config.appEnvironment !== 'production') {
    return new ConsoleEmailSender(baseUrl);
  }

  if (config.provider !== 'resend') {
    throw new Error(`Unsupported EMAIL_PROVIDER: ${config.provider}`);
  }

  if (!config.apiKey || !config.from) {
    throw new Error(
      'RESEND_API_KEY and RESEND_FROM_EMAIL must be set for the Resend provider.',
    );
  }

  return new ResendEmailSender(config.apiKey, config.from, baseUrl);
}

export const emailSenderProvider: FactoryProvider<EmailSender> = {
  provide: EMAIL_SENDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    createEmailSender({
      appEnvironment: config.getOrThrow<string>('APP_ENV'),
      apiKey: config.get<string>('RESEND_API_KEY'),
      baseUrl: config.getOrThrow<string>('WEB_BASE_URL'),
      from: config.get<string>('RESEND_FROM_EMAIL'),
      provider: config.getOrThrow<string>('EMAIL_PROVIDER'),
    }),
};
