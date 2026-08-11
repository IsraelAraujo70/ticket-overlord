# SETUP

Este guia prepara o Ticket Overlord para avaliação local. O fluxo padrão não exige conta em serviços externos: PostgreSQL roda pelo Docker e os links de e-mail são escritos no terminal da API.

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

Nunca versione o `.env` nem uma chave `RESEND_API_KEY`.

## 3. Banco, migrations e dados de avaliação

Prepare o PostgreSQL e aplique as migrations:

```bash
pnpm dev:prepare
```

Carregue um organizador, dois clientes, um administrador e um profissional de portaria:

```bash
pnpm db:seed
```

Todos os usuários de demonstração usam a senha `TicketOverlord2026!`:

| Papel | E-mail |
| --- | --- |
| Administrador | `admin@ticketoverlord.local` |
| Organizador | `organizer@ticketoverlord.local` |
| Cliente 1 | `customer.one@ticketoverlord.local` |
| Cliente 2 | `customer.two@ticketoverlord.local` |
| Portaria | `gate@ticketoverlord.local` |

Os seeds são idempotentes e podem ser executados novamente.

## 4. Desenvolvimento local

Inicie PostgreSQL, web e API:

```bash
pnpm dev
```

O comando aguarda o healthcheck do PostgreSQL e aplica migrations pendentes antes de iniciar as aplicações.

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- PostgreSQL: `localhost:5432`

Para iniciar somente API e banco, use `pnpm dev:api`. Para iniciar somente a web, use `pnpm dev:web`.

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

Use `Ctrl+C` e depois `pnpm dev:down` para encerrar. O volume do PostgreSQL é preservado.

## 7. Ambiente publicado

A URL planejada para o ambiente de demonstração é `https://ticketoverlord.israeldeveloper.com.br`.

Esse endereço ainda não deve ser tratado como disponível até o deploy ser concluído e verificado. Depois da publicação, o README será atualizado com o status e os avaliadores poderão exercitar o fluxo sem executar o projeto localmente.

## 8. Problemas comuns

### O e-mail não chegou

- Com `EMAIL_PROVIDER=console`, use o link mostrado no terminal da API.
- Com `EMAIL_PROVIDER=resend`, confirme a chave, o status `verified` do domínio e o endereço `RESEND_FROM_EMAIL`.
- Reinicie a API após alterar o `.env`.

### `relation "users" does not exist`

Execute `pnpm dev:prepare`. O comando cria o banco, aguarda o healthcheck e aplica as migrations pendentes.

### Portas ocupadas

Altere `WEB_PORT`, `API_PORT`, `POSTGRES_PORT` ou `POSTGRES_TEST_PORT` no `.env` antes de iniciar os serviços.
