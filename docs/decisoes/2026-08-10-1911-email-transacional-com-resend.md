# E-mail transacional com Resend

- **Status:** Aceita
- **Decidida em:** 2026-08-10 19:11:16 -03:00

## Contexto

Embora recuperação de senha e entrega de ingressos por e-mail não sejam obrigatórias no desafio, o produto decidiu exigir confirmação de e-mail e oferecer recuperação de senha. A implementação precisa usar Resend sem tornar testes ou desenvolvimento local dependentes de uma entrega externa real.

## Decisão

- Criar uma porta de e-mail transacional no módulo de autenticação.
- Implementar o adapter de produção com o SDK oficial do Resend.
- Configurar o adapter por `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `WEB_BASE_URL`.
- Exigir configuração válida do Resend em produção.
- Permitir um adapter local explícito em desenvolvimento que exibe o link no terminal, nunca em produção.
- Usar um adapter em memória nos testes, sem chamadas à rede.
- Enviar links de confirmação, reenvio e recuperação sem registrar chaves ou tokens em produção.
- Usar uma chave de idempotência por token ao enviar pelo Resend para reduzir duplicações em repetição da mesma operação.

## Alternativas consideradas

### Chamar o Resend diretamente nos controllers

Rejeitado porque acoplaria casos de uso ao fornecedor e dificultaria testes determinísticos.

### Exigir Resend também no desenvolvimento e nos testes

Rejeitado porque faria o fluxo local depender de credenciais, domínio verificado e disponibilidade externa.

### Adiar recuperação de senha

Rejeitado por decisão explícita de produto, apesar de estar fora do escopo mínimo do desafio.

## Consequências

- Produção não iniciará silenciosamente com e-mail inoperante.
- Desenvolvimento local continua exercitável sem uma chave real.
- Falha de entrega pode deixar uma conta criada e ainda não verificada; o reenvio permite recuperação.
- A configuração do domínio remetente será necessária antes de publicar, mas não faz parte desta implementação local.
