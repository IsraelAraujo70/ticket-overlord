# Deploy e storage no Railway

- **Status:** Aceita
- **Decidida em:** 2026-08-13 10:43:31 -03:00
- **Complementa:** [Stack principal e plataforma de deploy](./2026-08-10-1300-stack-e-deploy.md)
- **Complementa:** [Migrations no startup local](./2026-08-11-1013-migrations-no-startup-local.md)
- **Substitui parcialmente:** [Imagens de eventos em armazenamento S3](./2026-08-11-1553-imagens-de-eventos-em-storage-s3.md), somente quanto ao provedor usado em produção.

## Contexto

O fluxo local completo precisa ser publicado para avaliação. A aplicação já possui imagens separadas para web e API, PostgreSQL como fonte de verdade, Redis como dependência crítica dos holds e um adapter de objetos compatível com S3. A decisão anterior previa AWS S3 em produção, mas o Railway agora oferece buckets privados compatíveis com S3 no mesmo projeto dos serviços.

Produção também precisa aplicar migrations antes de iniciar uma nova versão sem misturar alteração de schema com o bootstrap da API.

## Decisão

- Criar um projeto Railway com ambiente `production`, serviços `web` e `api`, PostgreSQL, Redis e um bucket privado para capas.
- Construir web e API pelos Dockerfiles versionados a partir da raiz do monorepo.
- Manter configurações separadas em `railway.web.json` e `railway.api.json`, associadas explicitamente aos respectivos serviços.
- Executar migrations pelo `preDeployCommand` da API usando o artefato compilado e as migrations SQL incluídas na imagem.
- Não executar migrations no bootstrap normal da API e não executar seed automaticamente em todo deploy.
- Usar o Railway Bucket como provedor de produção através do adapter S3 existente, com credenciais injetadas somente na API, URL virtual-hosted e URLs temporárias de leitura.
- Conectar web, API, PostgreSQL e Redis por referências de variáveis e rede privada quando a comunicação não partir do navegador.
- Expor web e API por HTTPS, manter o bucket privado e validar o ambiente publicado antes de atualizar o status do README.

## Alternativas consideradas

### AWS S3

Continua tecnicamente compatível, mas foi substituído nesta entrega para reduzir configuração externa, credenciais e custo operacional durante a avaliação. O adapter permanece portável para AWS S3.

### MinIO em produção

Rejeitado porque exigiria operar armazenamento e volume persistente próprios. MinIO permanece somente no desenvolvimento local e nos testes.

### Migration no bootstrap da API

Rejeitada porque mistura alteração de schema com o processo que atende requisições e pode fazer várias réplicas disputarem a mesma responsabilidade. O pre-deploy mantém a etapa explícita e bloqueia a liberação quando uma migration falha.

### Seed automático em todo deploy

Rejeitado porque recriaria dados demonstrativos e restauraria ingressos consumidos sem uma decisão operacional. O seed de produção será uma ação explícita e confirmada.

## Consequências

- O ambiente inicial terá cinco recursos faturáveis ou medidos no Railway: web, API, PostgreSQL, Redis e bucket.
- As capas continuam privadas e acessíveis por URLs temporárias; trocar novamente para AWS S3 não exige alterar casos de uso.
- A imagem da API precisa conter o runner compilado de migrations, os arquivos SQL e as capas usadas pelo seed.
- A imagem web precisa conter `public/` além do output standalone do Next.js.
- Falha de migration impede a nova versão da API de iniciar, preservando a versão anterior.
- Seed, domínio customizado e qualquer mudança de produção continuam exigindo confirmação operacional imediata.
