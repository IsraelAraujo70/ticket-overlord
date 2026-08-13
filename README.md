# Ticket Overlord

Plataforma de eventos e ingressos desenvolvida para o desafio técnico **Verzel Elite Dev 2026**.

O produto permitirá que um organizador publique eventos a partir de um catálogo externo, clientes reservem e comprem ingressos com pagamento simulado e profissionais de portaria validem os ingressos por QR Code ou código manual.

> **Status:** fluxo local completo implementado, incluindo autenticação, publicação de eventos, reserva concorrente, pagamento simulado, ingressos assinados, compartilhamento e portaria. A aplicação ainda não foi publicada.

## Fluxo principal

1. O organizador cria e publica um evento.
2. O cliente encontra o evento e reserva ingressos.
3. O pagamento simulado é confirmado ou recusado.
4. Um pagamento confirmado gera um ingresso não forjável.
5. O cliente visualiza e compartilha o ingresso.
6. A portaria valida o ingresso uma única vez.

## Stack

- Next.js 16, React 19 e TypeScript no frontend.
- NestJS 11 e TypeScript sobre Node.js 24 LTS no backend.
- PostgreSQL 18 como fonte de verdade, com Drizzle ORM e migrations SQL versionadas.
- TMDb como catálogo externo de filmes e eventos locais persistidos no PostgreSQL.
- MinIO local e Railway Bucket S3-compatible em produção para capas privadas com URLs temporárias.
- PostgreSQL Full Text Search na primeira versão.
- pnpm 11 workspaces, sem orquestrador adicional.
- Docker Compose para validar as imagens de produção localmente.
- Railway para deploy.

As justificativas e consequências dessas escolhas estão registradas nas decisões técnicas.

O backend é organizado por feature. Dentro de cada módulo, `presentation` concentra HTTP, `application` coordena os casos de uso, `domain` mantém regras sem dependência do framework e `infrastructure` implementa persistência e integrações. Ports são usados apenas nas fronteiras reais, como banco de dados, e-mail e ViaCEP.

## Documentação

Toda a documentação necessária para desenvolver e avaliar o projeto é versionada neste repositório.

| Documento | Conteúdo |
| --- | --- |
| [`challenge.md`](./challenge.md) | Enunciado normalizado e critérios de sucesso do desafio. |
| [`docs/SETUP.md`](./docs/SETUP.md) | Setup local, dados de avaliação, e-mail em console ou Resend e solução de problemas. |
| [`docs/DEPLOY.md`](./docs/DEPLOY.md) | Recursos, variáveis e checklist do deploy no Railway. |
| [`docs/decisoes/index.md`](./docs/decisoes/index.md) | Índice cronológico das decisões técnicas aprovadas. |
| [`docs/plans/2026-08-10-monorepo-scaffold.md`](./docs/plans/2026-08-10-monorepo-scaffold.md) | Plano aprovado do scaffold inicial. |
| [`docs/plans/2026-08-10-auth-cadastro-e-recuperacao.md`](./docs/plans/2026-08-10-auth-cadastro-e-recuperacao.md) | Plano aprovado de autenticação, cadastro e recuperação. |
| [`docs/plans/2026-08-11-backend-modular-refactor.md`](./docs/plans/2026-08-11-backend-modular-refactor.md) | Plano aprovado da refatoração modular do backend. |
| [`docs/plans/2026-08-11-confirmacao-autologin-cabecalho-autenticado.md`](./docs/plans/2026-08-11-confirmacao-autologin-cabecalho-autenticado.md) | Plano aprovado do login automático após confirmação e do cabeçalho autenticado. |
| [`docs/plans/2026-08-11-admin-under-construction.md`](./docs/plans/2026-08-11-admin-under-construction.md) | Plano aprovado do estado temporário das áreas administrativas. |
| [`docs/plans/2026-08-11-backend-client-naming.md`](./docs/plans/2026-08-11-backend-client-naming.md) | Plano aprovado para tornar explícito o cliente interno do backend no Next.js. |
| [`docs/plans/2026-08-11-organizer-registration-fields.md`](./docs/plans/2026-08-11-organizer-registration-fields.md) | Plano aprovado dos campos validados no cadastro de organizadores. |
| [`docs/plans/2026-08-11-admin-event-creation.md`](./docs/plans/2026-08-11-admin-event-creation.md) | Plano aprovado da criação administrativa de eventos. |
| [`docs/plans/2026-08-11-reservation-checkout-payment.md`](./docs/plans/2026-08-11-reservation-checkout-payment.md) | Plano implementado de reserva concorrente, checkout e pagamento simulado. |
| [`docs/plans/2026-08-11-redis-inventory-holds.md`](./docs/plans/2026-08-11-redis-inventory-holds.md) | Plano implementado de holds temporários de inventário no Redis. |
| [`docs/plans/2026-08-12-tickets-qr-gate.md`](./docs/plans/2026-08-12-tickets-qr-gate.md) | Plano aprovado de ingressos, QR Code, compartilhamento e portaria. |
| [`AGENTS.md`](./AGENTS.md) | Contexto e regras locais para agentes que trabalham no projeto. |

O repositório é a fonte oficial da documentação. Páginas externas podem ser usadas como material de apresentação no futuro, mas não substituirão os arquivos versionados.

## Execução local

### Pré-requisitos

- Node.js 24 LTS.
- pnpm 11.10.0 via Corepack.
- Docker com Docker Compose.

Instale as dependências na raiz:

```bash
corepack enable
corepack prepare pnpm@11.10.0 --activate
pnpm install --frozen-lockfile
```

`pnpm dev` e `pnpm dev:api` iniciam PostgreSQL e MinIO, criam o bucket local, aguardam os healthchecks, aplicam automaticamente as migrations pendentes e carregam o `.env` da raiz antes de iniciar a API. Se a preparação ou a validação das variáveis falhar, as aplicações não são iniciadas.

Na primeira execução, prepare o banco e carregue os dados de avaliação:

```bash
pnpm dev:prepare
pnpm db:seed
```

Para iniciar PostgreSQL, web e API em desenvolvimento, com os logs das duas aplicações no mesmo terminal:

```bash
pnpm dev
```

As migrations podem ser executadas novamente com segurança; o Drizzle aplica somente as que ainda não constam no journal do banco.

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/openapi.json`, importável no Bruno.
- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

O adapter de e-mail local escreve os links de confirmação e recuperação no terminal da API. Para usar o Resend, configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `WEB_BASE_URL` no ambiente antes de iniciar. Um ambiente publicado também deve usar `APP_ENV=production`; nesse modo a API recusa iniciar com o adapter de console.

O catálogo público e o seed funcionam sem chamar serviços externos. Para buscar e selecionar um filme em `/admin/eventos/novo`, crie um token de leitura da API do TMDb e configure `TMDB_READ_ACCESS_TOKEN` no `.env`.

### Autenticação implementada

- Clientes: `/cadastro`, `/login`, `/confirmar-email`, `/esqueci-senha` e `/redefinir-senha`.
- Organizadores: `/admin/cadastro`, `/admin/login`, `/admin/confirmar-email`, `/admin/esqueci-senha` e `/admin/redefinir-senha`.
- Cadastro público somente para cliente e organizador.
- Confirmação de e-mail obrigatória com login automático, sessões opacas revogáveis e recuperação de senha de uso único.
- Cadastro de organizador com CNPJ numérico ou alfanumérico, telefone brasileiro em E.164, UF restrita às 27 unidades federativas e endereço preenchido pelo ViaCEP através da API.
- `ADMIN` autenticável, ainda sem painel global.
- `ORGANIZER_STAFF` disponível apenas como fixture; o fluxo de convite será a próxima etapa.

### Eventos implementados

- `/admin/eventos` lista somente os eventos da organização autenticada e permite publicar seus rascunhos futuros.
- `/admin/eventos/novo` busca filmes no TMDb e cria um evento local em rascunho com data, local, capacidade, preço e capa.
- Capas obrigatórias em JPEG, PNG ou WebP, com limite de 5 MiB, são armazenadas no MinIO local através da API compatível com S3.
- O catálogo público lê somente eventos locais `PUBLISHED`; rascunhos não ficam visíveis.
- O seed cria uma sessão de cinema publicada com capa local, sem depender do TMDb durante a carga.

### Reserva e pagamento implementados

- `/eventos/[slug]` apresenta o detalhe de uma sessão publicada, sua disponibilidade e a compra de 1 a 10 ingressos.
- Reservas autenticadas seguram a quantidade por 10 minutos e usam locking explícito no PostgreSQL para impedir venda acima da capacidade.
- `/checkout/[reservationId]` permite simular aprovação e recusa sem coletar dados financeiros.
- Pagamentos são idempotentes; aprovação mantém o inventário alocado, enquanto recusa ou expiração devolvem a quantidade à venda.

### Ingressos e portaria implementados

- Cada unidade de uma compra aprovada gera um ingresso individual com QR Code assinado por Ed25519 e código manual.
- `/meus-ingressos` lista a carteira do cliente; cada ingresso pode ser aberto e compartilhado por um link secreto somente para visualização.
- `/admin/portaria` permite que organizador ou staff leia o QR pela câmera ou informe o código manual para eventos da própria organização.
- A validação é atômica, aceita um ingresso somente uma vez e apenas no dia do evento em `America/Sao_Paulo`.

Para iniciar somente API e PostgreSQL:

```bash
pnpm dev:api
```

Para iniciar somente a web:

```bash
pnpm dev:web
```

O PostgreSQL continua ativo depois que os processos locais são encerrados. Para remover os containers e a rede, preservando os dados:

```bash
pnpm dev:down
```

### Execução integral no Docker

O comando abaixo constrói e inicia web, API e PostgreSQL com comandos de produção. Ele não usa watch nem monta o código-fonte do host:

```bash
pnpm dev:docker
```

Use `Ctrl+C` e depois `pnpm dev:down` para encerrar o ambiente. Portas e credenciais locais podem ser consultadas em [`.env.example`](./.env.example).

### Verificações

```bash
pnpm lint
pnpm test
pnpm build
docker compose config --quiet
```

O endpoint `GET http://localhost:3001/` retorna o estado da API. Os contratos implementados estão disponíveis no Swagger.

## Limitações atuais

- O painel global do administrador ainda não lista clientes ou organizadores.
- O convite de funcionários do organizador ainda não foi implementado.
- Edição, cancelamento e exclusão de eventos pelo painel ainda não foram implementados.
- A portaria depende de conexão com a API; operação offline não foi implementada.
- A câmera requer HTTPS fora de `localhost` e permissão do navegador; o código manual permanece disponível como fallback.
- A chave privada Ed25519 fica versionada no PostgreSQL nesta demonstração e deve migrar para KMS ou secret manager antes de uso real.
- O adapter de console revela links somente no desenvolvimento local e é proibido quando `APP_ENV=production`.
- Nenhum ambiente foi publicado.

## Dados de demonstração

Após `pnpm db:seed`, as contas abaixo estão verificadas e usam a senha local `TicketOverlord2026!`:

| Papel | E-mail |
| --- | --- |
| Administrador | `admin@ticketoverlord.local` |
| Organizador | `organizer@ticketoverlord.local` |
| Cliente 1 | `customer.one@ticketoverlord.local` |
| Cliente 2 | `customer.two@ticketoverlord.local` |
| Portaria, representando convite aceito | `gate@ticketoverlord.local` |

O seed também cria para o dia da execução quatro eventos de cinema publicados e dois ingressos pagos por evento para o Cliente 1, totalizando oito ingressos. Use essa conta em `/meus-ingressos` e a conta de Portaria em `/admin/portaria` para avaliar leitura do QR, evento incorreto, uso único e os demais resultados da validação.

## Uso de IA

ChatGPT e Codex estão sendo utilizados na análise do desafio, nas discussões de arquitetura e na documentação. As decisões são revisadas e aprovadas pelo desenvolvedor. O histórico de uso, as contribuições manuais e as limitações serão atualizados conforme o projeto evoluir.
