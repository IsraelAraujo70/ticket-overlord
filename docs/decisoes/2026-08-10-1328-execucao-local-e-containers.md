# Execução local e conteinerizada

- **Status:** Aceita
- **Decidida em:** 2026-08-10 13:28:14 -03:00

## Contexto

O monorepo precisa oferecer feedback rápido durante o desenvolvimento e uma forma de reproduzir a execução das imagens de produção. A web e a API se beneficiam de watch local, enquanto o PostgreSQL deve ser reproduzível e não depender de uma instalação no sistema operacional.

Também é necessário conferir se os artefatos que serão publicados iniciam corretamente sem watch, bind mount ou acesso ao código-fonte do host.

## Decisão

Manter dois modos de execução:

1. No modo local híbrido, `pnpm dev` inicia o PostgreSQL no Docker e executa web e API com watch no mesmo terminal. `pnpm dev:api` inicia o mesmo PostgreSQL e somente a API. O paralelismo e o streaming de logs serão fornecidos pelo próprio pnpm, sem um orquestrador adicional.
2. No modo conteinerizado, `pnpm dev:docker` constrói imagens multi-stage e executa web, API e PostgreSQL pelo Docker Compose. Web e API usam seus comandos de produção, sem watch ou bind mounts.

Usar PostgreSQL 18.4 e persistir o volume em `/var/lib/postgresql`, conforme o layout da imagem oficial para PostgreSQL 18 ou superior. A API só inicia no Compose depois que o healthcheck do banco estiver saudável.

`pnpm dev:down` remove containers e rede, mas preserva o volume nomeado do PostgreSQL.

## Alternativas consideradas

### Executar tudo localmente

Rejeitado porque exigiria instalar e manter PostgreSQL diretamente em cada máquina.

### Desenvolver integralmente no Docker com watch

Rejeitado como fluxo principal porque adicionaria sincronização de arquivos, bind mounts e mais latência ao feedback de Next.js e NestJS.

### Adicionar Turborepo ou `concurrently`

Rejeitado nesta etapa porque o paralelismo nativo do pnpm atende aos dois processos sem outra dependência ou camada de configuração.

### Montar o volume em `/var/lib/postgresql/data`

Rejeitado porque a imagem oficial mudou `PGDATA` e o volume declarado a partir do PostgreSQL 18. Usar o caminho antigo pode fazer os dados serem gravados fora do volume pretendido.

## Consequências

- O desenvolvimento local tem hot reload para web e API e um banco reproduzível.
- O Compose valida os mesmos comandos de produção esperados no deploy, mas ainda não representa a configuração do Railway.
- Encerrar `pnpm dev` ou `pnpm dev:api` não encerra automaticamente o PostgreSQL; o comando explícito é `pnpm dev:down`.
- O volume do banco sobrevive a `pnpm dev:down` e precisa de uma remoção deliberada caso seja necessário reinicializar todos os dados.
- A disponibilidade do PostgreSQL não comprova integração da API com o banco até Drizzle, migrations e queries serem implementados.
