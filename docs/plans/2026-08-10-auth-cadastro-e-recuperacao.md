# Plano de autenticação, cadastro e recuperação

- **Status:** Aprovado
- **Preparado em:** 2026-08-10 18:18:45 -03:00
- **Aprovado em:** 2026-08-10 19:11:16 -03:00
- **Implementação concluída em:** 2026-08-10 19:35:49 -03:00

Os gates `pnpm lint`, `pnpm test`, `pnpm build`, `docker compose config --quiet` e `git diff --check` passaram. Migration e seed foram executados no PostgreSQL local; os testes E2E utilizaram um PostgreSQL isolado.

## Resultado observável

- O cabeçalho público continuará direcionando compradores para `/login` e `/cadastro`.
- O CTA laranja para produtores direcionará organizadores para `/admin/login`, com acesso a `/admin/cadastro`.
- Clientes e organizadores usarão o mesmo contrato de autenticação na API, mas terão formulários, mensagens e redirecionamentos próprios no frontend.
- Todo cadastro público exigirá confirmação do e-mail antes do primeiro login.
- A recuperação de senha enviará um link pelo Resend sem revelar se o e-mail existe.
- O cadastro do organizador solicitará responsável, organização, CNPJ, telefone e endereço. O CEP preencherá logradouro, bairro, cidade e UF por uma consulta da API ao ViaCEP.
- `ADMIN` poderá autenticar, mas sua listagem administrativa ficará fora desta etapa.
- `ORGANIZER_STAFF` não terá cadastro público. A criação somente por convite será implementada na próxima etapa.

## Contratos e autorização

### Papéis

- `CUSTOMER`: cadastro público e acesso à experiência de compra.
- `ORGANIZER`: cadastro público e acesso ao painel da própria organização.
- `ADMIN`: criado por seed, com autenticação preparada para a futura administração da plataforma.
- `ORGANIZER_STAFF`: associado a uma organização e criado somente por convite; nesta etapa haverá apenas suporte no modelo e no seed de demonstração.

O cliente nunca enviará um papel arbitrário. `POST /auth/register` aceitará somente o discriminador público `accountType: customer | organizer`; o servidor fará o mapeamento para o papel persistido. Campos de organização serão obrigatórios apenas para `organizer`.

### Endpoints da API

- `POST /auth/register`: cria cliente ou organizador ainda não verificado e dispara a confirmação.
- `POST /auth/email/confirm`: consome uma vez o token de confirmação.
- `POST /auth/email/resend`: reenvia confirmação com resposta não enumerável.
- `POST /auth/login`: autentica somente contas verificadas e devolve uma sessão opaca.
- `GET /auth/me`: retorna a identidade e o papel da sessão.
- `POST /auth/logout`: revoga a sessão atual.
- `POST /auth/password/forgot`: sempre responde sem indicar se o e-mail existe.
- `POST /auth/password/reset`: consome uma vez o token, troca a senha e revoga todas as sessões existentes.
- `GET /addresses/cep/:cep`: valida oito dígitos e traduz as respostas do ViaCEP em um contrato estável.

Swagger continuará sendo a fonte do contrato. Decorators, DTOs e asserções E2E do OpenAPI serão alterados juntos.

## Persistência

Adicionar Drizzle ORM com `node-postgres` e migrations SQL versionadas para:

- `users`: identidade, e-mail normalizado único, hash da senha, papel e instante de verificação;
- `organizations`: dados do organizador, CNPJ normalizado único, telefone e endereço;
- `organization_members`: vínculo de proprietário ou funcionário com a organização;
- `auth_sessions`: somente o hash do token opaco, usuário e expiração;
- `auth_tokens`: somente o hash de tokens de confirmação e recuperação, finalidade, expiração e consumo.

O cadastro de organizador criará usuário, organização e vínculo de proprietário na mesma transação. E-mail e CNPJ duplicados serão protegidos também por constraints do PostgreSQL.

As migrations não serão executadas automaticamente ao iniciar a aplicação. Serão aplicadas pelo comando explícito `pnpm db:migrate` para separar inicialização de processo e alteração de schema.

## Segurança

- Senhas serão derivadas com `crypto.scrypt` do Node, salt aleatório e comparação em tempo constante, sem dependência adicional de hashing.
- A política inicial será de 12 a 128 caracteres, sem regras artificiais de composição.
- Sessões e tokens usarão 32 bytes aleatórios. Somente o SHA-256 será persistido.
- Sessões expirarão em sete dias, confirmações em 24 horas e recuperações em uma hora.
- O frontend guardará a sessão em cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. O navegador não persistirá token em `localStorage`.
- Links de confirmação e recuperação colocarão o token no fragmento da URL para que ele não seja enviado em logs HTTP; a página o consumirá e enviará ao backend.
- Respostas de reenvio e recuperação não permitirão enumerar contas.
- O CNPJ será normalizado e terá formato e dígitos verificadores validados localmente.
- O endereço do ViaCEP será uma ajuda de preenchimento. O usuário continuará responsável por número e complemento; indisponibilidade do ViaCEP não será confundida com CEP inexistente.

## E-mail e integrações

- Criar uma porta de e-mail transacional e um adapter Resend.
- Usar `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `WEB_BASE_URL`, sem registrar chaves ou tokens.
- Produção exigirá configuração válida do Resend.
- Desenvolvimento poderá usar um adapter local explícito para exibir o link no terminal; ele será proibido em produção.
- Testes usarão um adapter em memória e não chamarão Resend nem ViaCEP reais.
- O adapter ViaCEP usará `fetch` nativo, timeout e mapeamento explícito para formato inválido, não encontrado e indisponibilidade.

## Frontend

- Habilitar os formulários públicos de cliente em `/login` e `/cadastro`.
- Criar cadastro de organizador em `/admin/cadastro` e atualizar `/admin/login`.
- Transformar o banner laranja da landing page no CTA para organizadores.
- Criar páginas de confirmação, reenvio, esquecimento e redefinição de senha nas superfícies correspondentes.
- Usar ações/handlers do Next no servidor para conversar com a API e escrever o cookie `HttpOnly` no domínio da web.
- Proteger `/admin` no servidor para `ORGANIZER` e `ADMIN`; outros papéis receberão resposta de acesso negado ou redirecionamento apropriado.
- O painel global do `ADMIN`, o convite de funcionários e a validação de ingressos não serão implementados nesta etapa.

## Seeds

Adicionar seed idempotente de demonstração com contas verificadas para:

- um `ADMIN`;
- um `ORGANIZER` e sua organização;
- dois `CUSTOMER`;
- um `ORGANIZER_STAFF` associado à organização, representando um convite previamente aceito enquanto o fluxo de convite ainda não existe.

As credenciais de demonstração não serão usadas em produção e serão documentadas somente após o seed ser executado com sucesso.

## Dependências previstas

Produção da API:

- `drizzle-orm`;
- `pg`;
- `resend`;
- `class-validator` e `class-transformer` para validação dos DTOs.

Desenvolvimento da API:

- `drizzle-kit`;
- `@types/pg`.

Nenhuma nova dependência de frontend ou de validação de CNPJ/CEP será adicionada.

## Validação

1. Testes unitários para CNPJ, senha, hashing e mapeamento do ViaCEP.
2. Testes da API contra um PostgreSQL de teste isolado para cadastro transacional, unicidade, confirmação de e-mail, login, logout, recuperação de senha, tokens de uso único e revogação de sessões.
3. Asserções E2E dos métodos, schemas, autenticação e respostas críticas no OpenAPI gerado.
4. Testes de componentes e handlers do frontend para as duas entradas, preenchimento de CEP e estados de confirmação/recuperação.
5. Execução real de migration e seed no PostgreSQL local de desenvolvimento, sem tocar produção.
6. Gates finais: `pnpm lint`, `pnpm test`, `pnpm build` e `docker compose config --quiet`.

## Decisões a registrar após aprovação

- Modelo de identidade, organizações, papéis e convite futuro.
- Sessões opacas, armazenamento de senha e ciclo de tokens.
- E-mails transacionais com Resend e comportamento local.
- Cadastro de organizador e preenchimento de endereço via ViaCEP.

O plano aprovado também será salvo pelo MCP oficial no workspace `LLM Plans` do Reason. Como ainda não existe uma página do projeto, será criada a página `ticket-overlord`, com um banco de planos e uma linha contendo este documento. Nenhum outro conteúdo do Reason será alterado.

## Fora do escopo desta etapa

- Painel global e listagens do `ADMIN`.
- Criação e aceitação de convites para `ORGANIZER_STAFF`.
- Validação de ingressos.
- Eventos, reservas, pagamentos e emissão de ingressos.
- Verificação externa de situação cadastral do CNPJ.
- Deploy ou configuração de ambiente de produção.
