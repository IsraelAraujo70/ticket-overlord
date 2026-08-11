import { Resend } from 'resend';
import type {
  EmailSender,
  TransactionalEmail,
} from '../../application/ports/email-sender';
import { confirmationLink, passwordResetLink } from './email-links';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

interface EmailContent {
  html: string;
  text: string;
}

interface TransactionalEmailTemplate {
  actionLabel: string;
  description: string;
  eyebrow: string;
  expiresIn: string;
  heading: string;
  link: string;
  preheader: string;
  recipientName: string;
  securityNotice: string;
}

export function renderEmailConfirmation(
  message: TransactionalEmail,
  link: string,
): EmailContent {
  return renderTransactionalEmail({
    actionLabel: 'Confirmar meu e-mail',
    description:
      'Confirme seu endereço para entrar na plataforma e acessar seus ingressos com segurança.',
    eyebrow: 'CONFIRMAÇÃO DE CONTA',
    expiresIn: '24 horas',
    heading: 'Só falta confirmar seu e-mail',
    link,
    preheader: 'Confirme seu e-mail para ativar sua conta no Ticket Overlord.',
    recipientName: message.recipientName,
    securityNotice: 'Se você não criou esta conta, pode ignorar esta mensagem.',
  });
}

export function renderPasswordReset(
  message: TransactionalEmail,
  link: string,
): EmailContent {
  return renderTransactionalEmail({
    actionLabel: 'Criar nova senha',
    description:
      'Recebemos uma solicitação para redefinir a senha da sua conta. Use o botão abaixo para continuar.',
    eyebrow: 'RECUPERAÇÃO DE ACESSO',
    expiresIn: '1 hora',
    heading: 'Redefina sua senha',
    link,
    preheader: 'Use este link seguro para criar uma nova senha.',
    recipientName: message.recipientName,
    securityNotice:
      'Se você não solicitou uma nova senha, ignore esta mensagem. Sua senha atual continuará válida.',
  });
}

function renderTransactionalEmail(
  template: TransactionalEmailTemplate,
): EmailContent {
  const name = escapeHtml(template.recipientName);
  const link = escapeHtml(template.link);

  return {
    html: `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${escapeHtml(template.heading)}</title>
  </head>
  <body style="margin:0;background:#f6f8fc;color:#101426;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(template.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f6f8fc;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:0 0 18px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:44px;height:44px;border-radius:12px;background:#4056f4;color:#ffffff;font-size:15px;font-weight:800;line-height:44px;text-align:center;letter-spacing:-1px;">TO</td>
                    <td style="padding-left:12px;color:#101426;font-size:18px;font-weight:800;line-height:20px;letter-spacing:-0.4px;">TICKET<br>OVERLORD</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="overflow:hidden;border:1px solid #d8deea;border-radius:18px;background:#ffffff;box-shadow:0 18px 50px rgba(16,20,38,0.10);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:14px 32px;background:#ff6b4a;color:#30100a;font-size:11px;font-weight:800;letter-spacing:1.5px;line-height:16px;">${escapeHtml(template.eyebrow)}</td>
                    <td align="right" style="padding:14px 32px;background:#ff6b4a;color:#30100a;font-size:11px;font-weight:800;letter-spacing:1px;line-height:16px;white-space:nowrap;">VÁLIDO POR ${escapeHtml(template.expiresIn.toUpperCase())}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="height:10px;border-bottom:1px dashed #cbd3e2;background:#ffffff;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:38px 32px 32px;">
                      <p style="margin:0 0 10px;color:#65708a;font-size:16px;line-height:24px;">Olá, ${name}.</p>
                      <h1 style="margin:0 0 16px;color:#101426;font-size:30px;font-weight:800;line-height:36px;letter-spacing:-0.8px;">${escapeHtml(template.heading)}</h1>
                      <p style="margin:0 0 28px;color:#4c5770;font-size:16px;line-height:25px;">${escapeHtml(template.description)}</p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="border-radius:10px;background:#4056f4;">
                            <a href="${link}" style="display:inline-block;padding:15px 24px;color:#ffffff;font-size:16px;font-weight:700;line-height:20px;text-decoration:none;">${escapeHtml(template.actionLabel)}</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:28px 0 8px;color:#65708a;font-size:13px;line-height:20px;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
                      <p style="margin:0;word-break:break-all;color:#4056f4;font-size:12px;line-height:19px;"><a href="${link}" style="color:#4056f4;text-decoration:underline;">${link}</a></p>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:20px 32px;border-top:1px solid #e7ebf3;background:#f9faff;color:#65708a;font-size:13px;line-height:20px;">${escapeHtml(template.securityNotice)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 24px 0;color:#8791a8;font-size:12px;line-height:18px;">Ticket Overlord · Seu ingresso começa aqui.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: `Olá, ${template.recipientName}.\n\n${template.heading}\n\n${template.description}\n\n${template.actionLabel}: ${template.link}\n\nEste link expira em ${template.expiresIn}.\n\n${template.securityNotice}\n\nTicket Overlord`,
  };
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
    const content = renderEmailConfirmation(message, link);
    const { error } = await this.resend.emails.send(
      {
        from: this.from,
        to: message.recipient,
        subject: 'Confirme seu e-mail no Ticket Overlord',
        html: content.html,
        text: content.text,
      },
      { idempotencyKey: message.idempotencyKey },
    );

    if (error) {
      throw new Error(`Resend rejected email confirmation: ${error.message}`);
    }
  }

  async sendPasswordReset(message: TransactionalEmail): Promise<void> {
    const link = passwordResetLink(this.baseUrl, message.role, message.token);
    const content = renderPasswordReset(message, link);
    const { error } = await this.resend.emails.send(
      {
        from: this.from,
        to: message.recipient,
        subject: 'Redefina sua senha no Ticket Overlord',
        html: content.html,
        text: content.text,
      },
      { idempotencyKey: message.idempotencyKey },
    );

    if (error) {
      throw new Error(`Resend rejected password reset: ${error.message}`);
    }
  }
}
