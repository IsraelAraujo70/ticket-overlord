# Deploy no Railway

Este documento descreve a configuração aprovada do Ticket Overlord no Railway. Ele não comprova que o ambiente está disponível; o status público só deve ser atualizado depois da verificação do deploy.

## Recursos

O projeto usa um ambiente `production` com:

- `web`: Next.js standalone construído por `apps/web/Dockerfile`;
- `api`: NestJS construído por `apps/api/Dockerfile`;
- PostgreSQL gerenciado como fonte de verdade;
- Redis gerenciado para holds temporários;
- Railway Bucket privado para capas de eventos.

Os serviços usam a raiz do monorepo como contexto de build. Associe `/railway.web.json` ao serviço web e `/railway.api.json` ao serviço API.

## Variáveis da API

Configure sem registrar valores secretos em arquivos ou logs:

- `APP_ENV=production`;
- `DATABASE_URL` referenciando o PostgreSQL do projeto;
- `REDIS_URL` referenciando o Redis do projeto;
- `EMAIL_PROVIDER=resend`;
- `RESEND_API_KEY` e `RESEND_FROM_EMAIL`;
- `WEB_BASE_URL` com a origem HTTPS pública da web;
- `TMDB_READ_ACCESS_TOKEN`;
- `S3_ENDPOINT_URL` e `S3_PUBLIC_ENDPOINT_URL` com o endpoint do bucket;
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY` com as credenciais do bucket;
- `S3_FORCE_PATH_STYLE=false`;
- `S3_PRESIGNED_URL_TTL_SECONDS=900`.

O Railway fornece `PORT` automaticamente. A API executa `node dist/src/database/migrate.js` como pre-deploy e inicia com o comando definido na imagem.

## Variáveis da web

- `API_BASE_URL` aponta para a API pela rede privada do Railway.
- `PORT` é fornecida pelo Railway.

O navegador acessa a web por HTTPS. Chamadas da aplicação passam pelo BFF do Next.js, que alcança a API pela rede privada.

## Dados de demonstração

O seed não roda automaticamente. Quando autorizado, execute uma vez contra o ambiente de produção com `node dist/src/database/seed.js`. Ele cria contas demonstrativas, quatro eventos do dia e oito ingressos válidos. Uma nova execução restaura esses ingressos para `VALID`.

## Verificação

Depois do deploy:

1. confirme os deployments `SUCCESS` de web e API;
2. confirme `GET /` na API e a home da web;
3. confira `/docs` e `/docs/openapi.json`;
4. entre como Cliente 1 e abra `/meus-ingressos`;
5. entre como Portaria no celular, permita a câmera e valide um QR;
6. repita o QR e teste o mesmo ingresso no evento incorreto;
7. confirme que nenhuma variável secreta apareceu nos logs.
