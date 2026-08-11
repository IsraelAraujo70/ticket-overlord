# Refatoração modular do backend NestJS

## Objetivo

Reorganizar a API por feature e responsabilidade interna, preservando os contratos HTTP existentes e tornando casos de uso críticos testáveis sem HTTP, PostgreSQL ou integrações externas.

## Escopo aprovado

1. Centralizar e validar a configuração da API com `@nestjs/config`, carregando o `.env` da raiz.
2. Tornar o módulo de banco explícito e remover leituras diretas de `process.env` dos módulos executados pelo NestJS.
3. Criar um port de persistência de autenticação orientado às capacidades dos fluxos e um adapter Drizzle.
4. Separar cadastro, confirmação de e-mail, sessões e recuperação de senha em serviços de aplicação.
5. Manter Console e Resend como adapters de e-mail e traduzir erros de aplicação em um exception filter.
6. Aplicar a mesma separação ao módulo de endereços e ao adapter ViaCEP.
7. Dividir o schema Drizzle por contexto sem alterar o schema SQL nem gerar migration.
8. Adicionar testes unitários com fakes e preservar os testes E2E com PostgreSQL e asserções de Swagger.
9. Validar lint, testes, build, Docker Compose, startup com Node.js 24 e um reenvio real pelo Resend.
10. Atualizar as decisões e a documentação de setup.

## Fora do escopo

- Eventos, reservas, pagamentos, ingressos, convites e painel administrativo.
- CQRS, event bus, repositories genéricos, outbox ou abstrações para features ainda inexistentes.
- Deploy e alterações em produção.

## Critérios de conclusão

- Os endpoints e schemas públicos de autenticação e endereço permanecem compatíveis.
- O domínio não importa NestJS, Drizzle ou SDKs externos.
- Casos de uso não conhecem HTTP, Drizzle, Resend ou ViaCEP.
- O startup usa o `.env` da raiz e rejeita configuração inválida.
- A reorganização do schema não gera migration.
- Os testes unitários, E2E, lint e build passam com Node.js 24.
- Um reenvio de confirmação é aceito pelo Resend usando a configuração local do autor.
