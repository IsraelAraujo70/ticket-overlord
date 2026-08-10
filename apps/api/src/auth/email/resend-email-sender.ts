import { Resend } from 'resend';
import { confirmationLink, passwordResetLink } from './email-links';
import type { EmailSender, TransactionalEmail } from './email-sender';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export class ResendEmailSender implements EmailSender {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
    private readonly baseUrl: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async sendEmailConfirmation(message: TransactionalEmail): Promise<void> {
    const link = confirmationLink(this.baseUrl, message.role, message.token);
    const { error } = await this.resend.emails.send(
      {
        from: this.from,
        to: message.recipient,
        subject: 'Confirme seu e-mail no Ticket Overlord',
        html: `<p>Olá, ${escapeHtml(message.recipientName)}.</p><p><a href="${escapeHtml(link)}">Confirme seu e-mail</a> para acessar sua conta.</p>`,
        text: `Olá, ${message.recipientName}. Confirme seu e-mail: ${link}`,
      },
      { idempotencyKey: message.idempotencyKey },
    );

    if (error) {
      throw new Error(`Resend rejected email confirmation: ${error.message}`);
    }
  }

  async sendPasswordReset(message: TransactionalEmail): Promise<void> {
    const link = passwordResetLink(this.baseUrl, message.role, message.token);
    const { error } = await this.resend.emails.send(
      {
        from: this.from,
        to: message.recipient,
        subject: 'Redefina sua senha no Ticket Overlord',
        html: `<p>Olá, ${escapeHtml(message.recipientName)}.</p><p><a href="${escapeHtml(link)}">Redefina sua senha</a>. O link expira em uma hora.</p>`,
        text: `Olá, ${message.recipientName}. Redefina sua senha: ${link}`,
      },
      { idempotencyKey: message.idempotencyKey },
    );

    if (error) {
      throw new Error(`Resend rejected password reset: ${error.message}`);
    }
  }
}
