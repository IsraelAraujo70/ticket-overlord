# Migrations no startup local

- **Status:** Aceita
- **Decidida em:** 2026-08-11 10:13:25 -03:00
- **Complementa:** [Execução local e conteinerizada](./2026-08-10-1328-execucao-local-e-containers.md)

## Contexto

O fluxo local iniciava o PostgreSQL e as aplicações, mas exigia que o desenvolvedor executasse `pnpm db:migrate` separadamente. Em um volume novo, a API ficava disponível sem as relações esperadas e o primeiro cadastro falhava com `42P01 relation "users" does not exist`.

## Decisão

- Criar `pnpm dev:prepare` para iniciar o PostgreSQL, aguardar seu healthcheck e aplicar as migrations pendentes.
- Executar `dev:prepare` antes dos processos de watch em `pnpm dev` e antes da API em `pnpm dev:api`.
- Interromper o startup local se o banco não ficar saudável ou se uma migration falhar.
- Manter `pnpm dev:web` sem dependência do banco.
- Não alterar `pnpm dev:docker`, imagens de produção ou deploy. Migrations nesses ambientes continuam sendo uma etapa explícita.
- Não executar seeds automaticamente no startup.

## Alternativas consideradas

### Manter a migration como passo manual

Rejeitada porque permite iniciar uma API aparentemente saudável sobre um schema ausente ou desatualizado e torna a primeira execução mais sujeita a erro.

### Executar migrations dentro do bootstrap da API

Rejeitada porque misturaria a inicialização da aplicação com alteração de schema em todos os ambientes e exigiria permissões de DDL no processo de produção.

### Executar seeds junto com as migrations

Rejeitada porque dados de demonstração não são pré-requisito técnico para iniciar a aplicação e não devem ser recriados em todo startup.

## Consequências

- Um volume local vazio recebe o schema antes de a API aceitar requisições.
- Startups seguintes consultam o journal do Drizzle e não reaplicam migrations já concluídas.
- Falhas de schema aparecem no terminal antes de web e API iniciarem.
- O startup local fica um pouco mais lento pelo healthcheck e pela consulta de migrations.
- Produção e execução integral pelo Docker continuam exigindo uma etapa explícita de migration.
