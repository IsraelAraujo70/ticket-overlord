# Ticket Overlord

Plataforma de eventos e ingressos desenvolvida para o desafio técnico **Verzel Elite Dev 2026**.

O produto permitirá que um organizador publique eventos a partir de um catálogo externo, clientes reservem e comprem ingressos com pagamento simulado e profissionais de portaria validem os ingressos por QR Code ou código manual.

> **Status:** scaffold inicial implementado localmente. Os fluxos do produto ainda não foram implementados e a aplicação não foi publicada.

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
- PostgreSQL 18 como banco planejado; a integração com Drizzle ainda não foi implementada.
- PostgreSQL Full Text Search na primeira versão.
- pnpm 11 workspaces, sem orquestrador adicional.
- Docker Compose para validar as imagens de produção localmente.
- Railway para deploy.

As justificativas e consequências dessas escolhas estão registradas nas decisões técnicas.

## Documentação

Toda a documentação necessária para desenvolver e avaliar o projeto é versionada neste repositório.

| Documento | Conteúdo |
| --- | --- |
| [`challenge.md`](./challenge.md) | Enunciado normalizado e critérios de sucesso do desafio. |
| [`docs/decisoes/index.md`](./docs/decisoes/index.md) | Índice cronológico das decisões técnicas aprovadas. |
| [`docs/plans/2026-08-10-monorepo-scaffold.md`](./docs/plans/2026-08-10-monorepo-scaffold.md) | Plano aprovado do scaffold inicial. |
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

Para iniciar PostgreSQL, web e API em desenvolvimento, com os logs das duas aplicações no mesmo terminal:

```bash
pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/openapi.json`, importável no Bruno.
- PostgreSQL: `localhost:5432`

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

O endpoint `GET http://localhost:3001/` retorna o estado mínimo do scaffold da API.

## Limitações atuais

- A API ainda não acessa o PostgreSQL.
- Drizzle, migrations e seeds ainda não existem.
- Autenticação, eventos, reservas, pagamentos, ingressos e validação na portaria ainda não foram implementados.
- Nenhum ambiente foi publicado.

## Dados de demonstração esperados

- Um organizador.
- Dois clientes.
- Um usuário de portaria.
- Ao menos um evento publicado com ingressos disponíveis.

As credenciais serão registradas após a implementação e validação dos seeds.

## Uso de IA

ChatGPT e Codex estão sendo utilizados na análise do desafio, nas discussões de arquitetura e na documentação. As decisões são revisadas e aprovadas pelo desenvolvedor. O histórico de uso, as contribuições manuais e as limitações serão atualizados conforme o projeto evoluir.
