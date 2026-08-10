# Identidade, papéis e organizações

- **Status:** Aceita
- **Decidida em:** 2026-08-10 19:11:16 -03:00

## Contexto

O produto possui compradores, empresas organizadoras, administradores globais e profissionais de portaria. O desafio exige autenticação para organizador, cliente e portaria, mas a portaria pertence operacionalmente a um organizador. O frontend também precisa privilegiar compradores sem misturar sua entrada com a aquisição de organizadores.

## Decisão

- Persistir quatro papéis: `CUSTOMER`, `ORGANIZER`, `ADMIN` e `ORGANIZER_STAFF`.
- Tratar `ORGANIZER_STAFF` como membro de uma organização com permissões limitadas à futura validação de ingressos.
- Permitir cadastro público somente para `CUSTOMER` e `ORGANIZER` por `POST /auth/register`.
- Aceitar no cadastro apenas o discriminador `accountType: customer | organizer`; o cliente nunca enviará um papel persistido arbitrário.
- Criar `ADMIN` por seed ou operação administrativa futura.
- Criar `ORGANIZER_STAFF` somente pelo futuro fluxo de convite de um organizador. O seed de avaliação poderá representar um convite já aceito.
- Manter entradas separadas no frontend: compradores em `/login` e `/cadastro`; organizadores em `/admin/login` e `/admin/cadastro`.
- Preparar autenticação e autorização de `ADMIN` nesta etapa, sem implementar seu painel global.

## Alternativas consideradas

### Cadastro público de qualquer papel

Rejeitado porque permitiria elevação de privilégio para `ADMIN` ou `ORGANIZER_STAFF`.

### Tratar portaria como administrador global

Rejeitado porque a portaria não deve acessar clientes, organizações ou eventos de terceiros.

### Aplicações independentes por papel

Rejeitado. A decisão existente mantém uma única aplicação Next.js; rotas e layouts separados fornecem a distinção necessária sem duplicar builds.

## Consequências

- A autorização precisa verificar papel e vínculo com a organização no backend.
- O cadastro de organizador cria usuário, organização e vínculo de proprietário na mesma transação.
- O fluxo obrigatório de convite será implementado depois desta etapa.
- Esconder controles no frontend não substitui a autorização da API.
