# Scaffold inicial do monorepo

- **Status:** Concluído
- **Data:** 2026-08-10
- **Aprovado em:** 2026-08-10 13:19:48 -03:00
- **Concluído em:** 2026-08-10 13:30:43 -03:00
- **Escopo:** estrutura executável do monorepo com PostgreSQL e execução local ou conteinerizada, sem funcionalidades do produto

## Resultado observável

Ao concluir este plano:

- `pnpm dev` iniciará PostgreSQL no Docker e executará web e API simultaneamente, com os logs dos dois processos no mesmo terminal;
- `pnpm dev:web` iniciará somente a aplicação Next.js em `http://localhost:3000`;
- `pnpm dev:api` iniciará PostgreSQL no Docker e a API NestJS em `http://localhost:3001`;
- `pnpm dev:docker` construirá e executará web, API e PostgreSQL no Docker Compose, sem watch e sem bind mount do código-fonte;
- `pnpm dev:down` encerrará e removerá os containers locais, preservando o volume de dados do PostgreSQL;
- a página inicial identificará o Ticket Overlord como scaffold em desenvolvimento;
- `GET /` na API retornará uma resposta mínima que permite verificar que o serviço está ativo;
- instalação, lint, testes e builds poderão ser executados a partir da raiz.

## Decisões aplicadas

- pnpm workspaces, sem adicionar Turborepo nesta etapa;
- Node.js 24 LTS, porque a versão local atual, Node.js 25, já está fora de suporte;
- pnpm 11.10.0 fixado pelo campo `packageManager`;
- PostgreSQL 18.4, versão estável e suportada, em imagem oficial;
- `apps/web`: Next.js com App Router, React, TypeScript estrito, ESLint, diretório `src` e CSS nativo;
- `apps/api`: NestJS, TypeScript estrito, ESLint, Prettier e testes Jest gerados pelo scaffold oficial;
- Dockerfiles multi-stage separados para web e API, com comandos de build e execução de produção;
- Docker Compose com healthcheck do PostgreSQL e dependência da API condicionada ao banco saudável;
- nenhuma dependência de ORM, autenticação, UI kit ou integração externa neste corte.

As versões exatas das dependências serão registradas no lockfile gerado durante a implementação. Serão usadas versões estáveis compatíveis com Node.js 24 disponíveis no momento do scaffold, nunca versões `canary`, `beta` ou `rc`.

## Arquivos e estrutura

```text
.
├── .gitignore
├── .node-version
├── compose.yaml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── apps
│   ├── api
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src
│   │   └── test
│   └── web
│       ├── Dockerfile
│       ├── package.json
│       └── src/app
└── docs
    └── plans
```

Arquivos auxiliares gerados oficialmente pelo Next.js e NestJS, como configurações de TypeScript, ESLint, Jest e framework, permanecerão dentro de cada aplicação. READMEs e arquivos de agente gerados pelos CLIs não duplicarão os documentos existentes na raiz.

## Etapas de implementação

1. Criar a branch local `feat/monorepo-scaffold` a partir do `main` limpo e marcar este plano como aprovado.
2. Criar a configuração da raiz:
   - workspace pnpm limitado a `apps/*`;
   - `pnpm dev` iniciando o banco e usando o paralelismo e o streaming nativos do pnpm para web e API;
   - scripts `dev:web`, `dev:api`, `dev:docker`, `dev:down`, `lint`, `test` e `build`;
   - versão suportada do Node.js e regras de ignore compartilhadas.
3. Gerar `apps/web` com o CLI oficial do Next.js, sem Tailwind e sem instalar dependências isoladamente; substituir a página demonstrativa por uma página mínima do Ticket Overlord.
4. Gerar `apps/api` com o CLI oficial do NestJS em modo estrito, usando pnpm e sem instalar dependências isoladamente; configurar a porta padrão como `3001` e manter um endpoint raiz mínimo testado.
5. Adicionar o ambiente local:
   - PostgreSQL 18.4 com volume nomeado e healthcheck;
   - API usando `DATABASE_URL` preparada para a futura integração com Drizzle;
   - Dockerfiles multi-stage de produção para web e API;
   - Compose sem `develop.watch`, bind mounts ou comandos de desenvolvimento.
6. Instalar todas as dependências uma vez pela raiz e gerar um único `pnpm-lock.yaml`.
7. Registrar em `docs/decisoes/` a decisão aprovada sobre os dois modos de execução e a versão do PostgreSQL, incluindo-a no índice cronológico.
8. Atualizar o `README.md` somente com comandos que tiverem sido executados com sucesso e ajustar o status do projeto de planejamento para scaffold inicial.
9. Após todos os gates passarem, criar um commit em inglês contendo apenas este plano e o scaffold e enviar a feature branch ao remoto, conforme o fluxo definido em `AGENTS.md`.

## Validação

Executar, nesta ordem:

1. `pnpm install --frozen-lockfile` após a geração do lockfile;
2. `pnpm lint`;
3. `pnpm test`;
4. `pnpm build`;
5. validar `docker compose config`;
6. executar `pnpm dev`, confirmar PostgreSQL saudável e verificar web e API com requisições HTTP;
7. executar `pnpm dev:api` isoladamente e verificar API e PostgreSQL;
8. executar `pnpm dev:docker`, confirmar que não existem bind mounts nem watch e verificar os três serviços;
9. executar `pnpm dev:down`, encerrar processos locais e confirmar que nenhum job ficou em segundo plano.

### Resultado da validação

- instalação congelada, lint, testes unitários, teste E2E e builds passaram;
- os mesmos gates passaram em um container isolado com Node.js 24.18.1;
- `pnpm dev`, `pnpm dev:api` e `pnpm dev:docker` responderam nos endpoints esperados;
- web, API e PostgreSQL ficaram saudáveis no Compose;
- web e API não receberam bind mounts, e os containers executaram Node.js 24.18.1;
- PostgreSQL executou na versão 18.4 com volume em `/var/lib/postgresql`;
- `pnpm dev:down` removeu containers e rede, preservou o volume e liberou as portas.

## Fora de escopo

- Drizzle, migrations e seeds;
- contratos compartilhados entre frontend e backend;
- autenticação, autorização e qualquer fluxo de produto;
- CI/CD, Railway e deploy;
- componentes visuais definitivos.

## Riscos e limites

- O Node.js instalado localmente é 25.8.0 e não deve ser usado como referência de runtime do projeto. A implementação precisa executar os gates com Node.js 24 ou registrar claramente se o gerenciador de versões local não estiver disponível.
- O PostgreSQL estará disponível, mas a API ainda não executará queries até a etapa de Drizzle e migrations. O healthcheck comprovará a disponibilidade do serviço, não a persistência da aplicação.
- `pnpm dev` e `pnpm dev:api` deixarão o container gerenciado do PostgreSQL ativo após o encerramento dos processos Node. `pnpm dev:down` será o encerramento explícito e documentado do ambiente.
- Os geradores podem criar arquivos além da estrutura resumida. Cada arquivo será revisado e boilerplate desnecessário será removido antes da validação.
- Um scaffold verde prova apenas a integridade estrutural e dos toolchains, não as decisões futuras de domínio, persistência ou concorrência.
