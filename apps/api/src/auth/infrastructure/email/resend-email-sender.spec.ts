import type { TransactionalEmail } from '../../application/ports/email-sender';
import {
  renderEmailConfirmation,
  renderPasswordReset,
} from './resend-email-sender';

const message: TransactionalEmail = {
  recipient: 'customer@example.com',
  recipientName: 'Israel <Admin>',
  role: 'CUSTOMER',
  token: 'secret-token',
  idempotencyKey: 'email/test',
};

describe('Resend email templates', () => {
  it('renders a branded confirmation email with an escaped recipient', () => {
    const link = 'https://ticket.example.com/confirmar-email#token=secret';
    const content = renderEmailConfirmation(message, link);

    expect(content.html).toContain('<html lang="pt-BR">');
    expect(content.html).toContain('TICKET<br>OVERLORD');
    expect(content.html).toContain('Confirmar meu e-mail');
    expect(content.html).toContain('VÁLIDO POR 24 HORAS');
    expect(content.html).toContain('Israel &lt;Admin&gt;');
    expect(content.html).not.toContain('Israel <Admin>');
    expect(content.html).toContain(link);
    expect(content.text).toContain(`Confirmar meu e-mail: ${link}`);
  });

  it('renders the password reset copy and one-hour expiration', () => {
    const link = 'https://ticket.example.com/redefinir-senha#token=secret';
    const content = renderPasswordReset(message, link);

    expect(content.html).toContain('Criar nova senha');
    expect(content.html).toContain('VÁLIDO POR 1 HORA');
    expect(content.html).toContain('Sua senha atual continuará válida.');
    expect(content.text).toContain(`Criar nova senha: ${link}`);
    expect(content.text).toContain('Este link expira em 1 hora.');
  });
});
