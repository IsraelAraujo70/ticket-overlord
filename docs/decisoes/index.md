# Decisões técnicas

Este diretório contém as decisões técnicas aprovadas para o Ticket Overlord. Os registros preservam o contexto e os trade-offs de cada escolha para que mudanças futuras sejam deliberadas e rastreáveis.

## Convenção

- Nome: `YYYY-MM-DD-HHmm-<slug>.md`.
- Horário: `America/Sao_Paulo`, sempre acompanhado do offset UTC.
- Status possíveis: `Proposta`, `Aceita`, `Substituída` ou `Rejeitada`.
- Conteúdo mínimo: contexto, decisão, alternativas consideradas e consequências.
- Uma decisão aceita não deve ser reescrita para representar uma mudança posterior. A mudança recebe um novo registro que referencia e substitui o anterior.

## Índice

| Data e hora                | Status      | Decisão                                                                                                                  |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-10 13:00:57 -03:00 | Aceita      | [Stack principal e plataforma de deploy](./2026-08-10-1300-stack-e-deploy.md)                                            |
| 2026-08-10 13:00:57 -03:00 | Substituída | [Ports and adapters pragmático](./2026-08-10-1300-ports-and-adapters-pragmatico.md)                                      |
| 2026-08-10 13:00:57 -03:00 | Aceita      | [Evolução da busca](./2026-08-10-1300-evolucao-da-busca.md)                                                              |
| 2026-08-10 13:28:14 -03:00 | Aceita      | [Execução local e conteinerizada](./2026-08-10-1328-execucao-local-e-containers.md)                                      |
| 2026-08-10 14:05:54 -03:00 | Aceita      | [Swagger como fonte do contrato HTTP](./2026-08-10-1405-swagger-como-fonte-do-contrato.md)                               |
| 2026-08-10 14:18:45 -03:00 | Aceita      | [Design system e superfícies web](./2026-08-10-1418-design-system-e-superficies-web.md)                                  |
| 2026-08-10 14:48:25 -03:00 | Aceita      | [BFF do catálogo público](./2026-08-10-1448-bff-do-catalogo-publico.md)                                                  |
| 2026-08-10 19:11:16 -03:00 | Aceita      | [Identidade, papéis e organizações](./2026-08-10-1911-identidade-papeis-e-organizacoes.md)                               |
| 2026-08-10 19:11:16 -03:00 | Aceita      | [Sessões, senhas e tokens de autenticação](./2026-08-10-1911-sessoes-senhas-e-tokens.md)                                 |
| 2026-08-10 19:11:16 -03:00 | Aceita      | [E-mail transacional com Resend](./2026-08-10-1911-email-transacional-com-resend.md)                                     |
| 2026-08-10 19:11:16 -03:00 | Aceita      | [Cadastro de organizador e preenchimento pelo ViaCEP](./2026-08-10-1911-cadastro-organizador-e-viacep.md)                |
| 2026-08-11 10:00:34 -03:00 | Aceita      | [Política de senhas fortes](./2026-08-11-1000-politica-de-senhas-fortes.md)                                              |
| 2026-08-11 10:13:25 -03:00 | Aceita      | [Migrations no startup local](./2026-08-11-1013-migrations-no-startup-local.md)                                          |
| 2026-08-11 10:31:56 -03:00 | Aceita      | [Conclusão do cadastro em página dedicada](./2026-08-11-1031-conclusao-do-cadastro.md)                                   |
| 2026-08-11 11:02:05 -03:00 | Aceita      | [Arquitetura modular em camadas com ports nas fronteiras](./2026-08-11-1102-arquitetura-modular-em-camadas-com-ports.md) |
| 2026-08-11 15:53:35 -03:00 | Aceita      | [Catálogo externo e eventos locais](./2026-08-11-1553-catalogo-externo-e-eventos-locais.md)                              |
| 2026-08-11 15:53:35 -03:00 | Aceita      | [Imagens de eventos em armazenamento S3](./2026-08-11-1553-imagens-de-eventos-em-storage-s3.md)                          |
| 2026-08-11 19:40:35 -03:00 | Aceita      | [Wizard e pré-processamento da capa do evento](./2026-08-11-1940-wizard-e-pre-processamento-da-capa.md)                  |
| 2026-08-11 20:32:54 -03:00 | Aceita      | [Publicação explícita de eventos](./2026-08-11-2032-publicacao-explicita-de-eventos.md)                                  |
| 2026-08-11 21:15:36 -03:00 | Aceita      | [Pagamento simulado interno antes de provedor externo](./2026-08-11-2115-pagamento-simulado-interno.md)                  |
| 2026-08-11 22:24:31 -03:00 | Aceita      | [Holds temporários de inventário no Redis](./2026-08-11-2224-holds-temporarios-no-redis.md)                              |
| 2026-08-12 09:55:48 -03:00 | Aceita      | [Ingressos assinados e validação atômica na portaria](./2026-08-12-0955-ingressos-assinados-e-validacao-atomica.md)      |
| 2026-08-12 10:22:26 -03:00 | Aceita      | [Código manual recuperável](./2026-08-12-1022-codigo-manual-recuperavel.md)                                              |
| 2026-08-13 10:43:31 -03:00 | Aceita      | [Deploy e storage no Railway](./2026-08-13-1043-deploy-e-storage-no-railway.md)                                          |
| 2026-08-13 11:05:58 -03:00 | Aceita      | [Eventos manuais e catálogo por categoria](./2026-08-13-1105-eventos-manuais-e-catalogo-por-categoria.md)                |
| 2026-08-13 12:42:27 -03:00 | Aceita      | [Eventos globais somente leitura para administradores](./2026-08-13-1242-admin-global-eventos-somente-leitura.md)        |
| 2026-08-14 11:04:16 -03:00 | Aceita      | [Hardening, paginação e seed de volume](./2026-08-14-1104-hardening-paginacao-e-seed-de-volume.md)                       |
| 2026-08-14 11:56:12 -03:00 | Aceita      | [Cache do catálogo público](./2026-08-14-1156-cache-do-catalogo-publico.md)                                              |
| 2026-08-14 16:00:16 -03:00 | Aceita      | [Search híbrida com PostgreSQL e pgvector](./2026-08-14-1600-search-hibrida-postgresql-pgvector.md)                      |
| 2026-08-14 16:30:03 -03:00 | Aceita      | [Relatórios operacionais por organização](./2026-08-14-1630-relatorios-operacionais-por-organizacao.md)                  |
