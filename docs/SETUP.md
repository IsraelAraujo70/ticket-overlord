# SETUP

Este guia prepara o Ticket Overlord para avaliação local. PostgreSQL e MinIO rodam pelo Docker, e os links de e-mail são escritos no terminal da API. O catálogo público funciona com os dados do seed; somente a criação de eventos da categoria Cinema exige um token do TMDb. As demais categorias usam cadastro manual.

## 1. Pré-requisitos

- Node.js 24 LTS.
- pnpm 11.10.0 via Corepack.
- Docker com Docker Compose.

Confirme as versões:

```bash
node --version
pnpm --version
docker compose version
```

## 2. Instalação e variáveis

Na raiz do repositório:

```bash
corepack enable
corepack prepare pnpm@11.10.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
```

O `.env.example` usa `EMAIL_PROVIDER=console`. Esse modo permite testar cadastro, confirmação e recuperação sem criar uma conta no Resend. Os links são exibidos nos logs da API e nenhum e-mail real é enviado.

Para testar a criação de eventos, crie um token de leitura da API no TMDb e preencha `TMDB_READ_ACCESS_TOKEN`. Sem ele, o catálogo público continua funcionando, mas a busca em `/admin/eventos/novo` retorna uma mensagem de configuração.

A API carrega automaticamente o arquivo `.env` da raiz. No startup, ela valida as variáveis obrigatórias e encerra com uma mensagem de configuração quando faltarem `DATABASE_URL` ou, no modo Resend, `RESEND_API_KEY` e `RESEND_FROM_EMAIL` válidos.

Nunca versione o `.env`, `RESEND_API_KEY` ou `TMDB_READ_ACCESS_TOKEN`.

## 3. Banco, migrations e dados de avaliação

Prepare PostgreSQL e MinIO, crie o bucket local e aplique as migrations:

```bash
pnpm dev:prepare
```

Carregue os usuários de avaliação e o conjunto paginado de eventos:

```bash
pnpm db:seed
```

Todos os usuários de demonstração usam a senha `TicketOverlord2026!`:

| Papel         | E-mail                              |
| ------------- | ----------------------------------- |
| Administrador | `admin@ticketoverlord.local`        |
| Organizador   | `organizer@ticketoverlord.local`    |
| Cliente 1     | `customer.one@ticketoverlord.local` |
| Cliente 2     | `customer.two@ticketoverlord.local` |
| Portaria      | `gate@ticketoverlord.local`         |

O seed é idempotente e pode ser executado novamente. Por padrão ele mantém 9.000 eventos publicados em 30 organizações, quatro capas compartilhadas e oito ingressos válidos do Cliente 1. Use `SEED_EVENT_COUNT` entre 4 e 50.000 para ajustar o volume.

## 4. Desenvolvimento local

Inicie PostgreSQL, web e API:

```bash
pnpm dev
```

O comando aguarda o healthcheck do PostgreSQL, aplica migrations pendentes e valida o `.env` da raiz antes de iniciar as aplicações.

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

Para iniciar somente API e infraestrutura, use `pnpm dev:api`. Para iniciar somente a web, use `pnpm dev:web`.

### Teste da portaria pelo celular

1. No computador, entre como `customer.one@ticketoverlord.local`, abra `/meus-ingressos` e exiba o QR Code de um ingresso.
2. No celular, entre como `gate@ticketoverlord.local`, abra `/admin/portaria` e selecione o evento correspondente.
3. Leia o QR exibido no computador e repita a leitura para confirmar a rejeição por uso duplicado.
4. Selecione outro evento e leia um QR ainda válido para confirmar o resultado de evento incorreto.

A câmera do navegador exige uma origem HTTPS quando a aplicação não está em `localhost`. Para testar pelo celular, exponha a web por um túnel HTTPS temporário ou use uma configuração HTTPS local confiável; acessar apenas `http://<ip-do-computador>:3000` mantém o fallback manual, mas não habilita a câmera.

## 5. E-mails reais com Resend

Quem quiser receber mensagens reais ao executar o projeto localmente precisa usar a própria conta do Resend:

1. Adicione um domínio que você controla no painel do Resend.
2. Publique os registros DNS de SPF e DKIM apresentados pelo serviço e aguarde o domínio ficar `verified`.
3. Crie uma API key com permissão `Sending access`, preferencialmente restrita ao domínio usado pelo projeto.
4. Atualize o `.env`:

```dotenv
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_sua_chave
RESEND_FROM_EMAIL=Ticket Overlord <ingressos@seu-dominio-verificado.com>
WEB_BASE_URL=http://localhost:3000
```

Reinicie a API depois de alterar essas variáveis. O domínio do endereço `RESEND_FROM_EMAIL` precisa ser o mesmo que foi verificado no Resend.

O Ticket Overlord usa `ingressos@israeldeveloper.com.br` nos ambientes mantidos pelo autor. Quem fizer um fork deve substituir esse remetente pelo próprio domínio verificado.

Documentação oficial: [domínios no Resend](https://resend.com/docs/dashboard/domains/introduction) e [API keys no Resend](https://resend.com/docs/dashboard/api-keys/introduction).

## 6. Execução integral pelo Docker

Prepare o banco e os dados antes de iniciar as imagens de produção locais:

```bash
pnpm dev:prepare
pnpm db:seed
pnpm dev:docker
```

Use `Ctrl+C` e depois `pnpm dev:down` para encerrar. Os volumes do PostgreSQL e do MinIO são preservados.

## 7. Ambiente publicado

O ambiente de demonstração está disponível em:

- Web: `https://ticketoverlord.israeldeveloper.com.br`;
- API: `https://api.ticketoverlord.israeldeveloper.com.br`;
- Swagger: `https://api.ticketoverlord.israeldeveloper.com.br/docs`.

As credenciais do ambiente publicado são dados de avaliação e devem ser fornecidas separadamente. A senha fallback documentada neste guia é exclusivamente local.

## 8. Problemas comuns

### O e-mail não chegou

- Com `EMAIL_PROVIDER=console`, use o link mostrado no terminal da API.
- Com `EMAIL_PROVIDER=resend`, confirme a chave, o status `verified` do domínio e o endereço `RESEND_FROM_EMAIL`.
- Reinicie a API após alterar o `.env`.
- Verifique no painel do Resend se a mensagem foi aceita, entregue, rejeitada ou suprimida. Uma resposta aceita pela API do Resend não garante que o provedor destinatário a colocou na caixa principal.

### `relation "users" does not exist`

Execute `pnpm dev:prepare`. O comando cria o banco, aguarda o healthcheck e aplica as migrations pendentes.

### Portas ocupadas

Altere `WEB_PORT`, `API_PORT`, `POSTGRES_PORT`, `POSTGRES_TEST_PORT`, `MINIO_PORT` ou `MINIO_CONSOLE_PORT` no `.env` antes de iniciar os serviços.

### A busca do TMDb não está configurada

Crie um token de leitura da API do TMDb, configure `TMDB_READ_ACCESS_TOKEN` no `.env` e reinicie a API. Os eventos publicados pelo seed não dependem desse token.

## 9. Armazenamento em produção

No Railway, configure `S3_ENDPOINT_URL` e `S3_PUBLIC_ENDPOINT_URL` com os endpoints S3-compatible do Railway Bucket, além de `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY`. Use `S3_FORCE_PATH_STYLE=false`.

Na AWS, omita os endpoints customizados e prefira uma role IAM. O MinIO local usa os endpoints e credenciais definidos no `.env.example`.

## 10. Seed autorizado em produção

O seed de produção nunca roda automaticamente. A execução one-off precisa definir, somente durante o comando:

```bash
APP_ENV=production \
ALLOW_PRODUCTION_DEMO_SEED=true \
DEMO_PASSWORD='<senha-fornecida-fora-do-repositorio>' \
SEED_EVENT_COUNT=9000 \
node dist/src/database/seed.js
```

Confirme o projeto, ambiente, serviço e banco antes da execução. O comando cria ou atualiza contas demonstrativas verificadas, 30 organizações, 9.000 eventos e oito ingressos; não use em um banco com dados reais.
