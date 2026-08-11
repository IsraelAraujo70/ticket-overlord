import { ConsoleEmailSender } from './console-email-sender';
import { createEmailSender } from './email-sender.provider';
import { ResendEmailSender } from './resend-email-sender';

describe('email sender provider', () => {
  it('uses the console adapter for local development', () => {
    expect(
      createEmailSender({
        appEnvironment: 'local',
        baseUrl: 'http://localhost:3000',
        provider: 'console',
      }),
    ).toBeInstanceOf(ConsoleEmailSender);
  });

  it('uses Resend only with complete credentials', () => {
    expect(
      createEmailSender({
        appEnvironment: 'production',
        apiKey: 're_test',
        baseUrl: 'https://ticket.example.com',
        from: 'Ticket Overlord <tickets@example.com>',
        provider: 'resend',
      }),
    ).toBeInstanceOf(ResendEmailSender);

    expect(() =>
      createEmailSender({
        appEnvironment: 'production',
        baseUrl: 'https://ticket.example.com',
        provider: 'console',
      }),
    ).toThrow('EMAIL_PROVIDER must be resend in production');
  });
});
