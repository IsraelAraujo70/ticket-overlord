# Confirmação com login automático e cabeçalho autenticado

## Resultado observável

Ao confirmar um e-mail pela primeira vez, a API também criará uma sessão. A página mostrará “Seu e-mail foi confirmado”, exibirá a contagem regressiva `3, 2, 1` e redirecionará clientes para `/` e perfis administrativos para `/admin`.

Na landing page e na busca, uma sessão válida substituirá os botões “Entrar” e “Cadastre-se”, no canto superior direito, por nome, papel da conta e um menu acessível com a ação “Sair”.

Rótulos aprovados:

- `CUSTOMER`: Perfil cliente.
- `ORGANIZER`: Perfil organizador.
- `ADMIN`: Perfil administrador.
- `ORGANIZER_STAFF`: Perfil portaria.

## Contrato e segurança

1. Alterar `POST /auth/email/confirm` de `204` para `200` com resposta explícita.
2. Na primeira confirmação válida, consumir o token, verificar o usuário e criar a sessão na mesma transação PostgreSQL. A resposta incluirá o token opaco da sessão, expiração e usuário, seguindo o formato atual de login.
3. Uma repetição do mesmo token continuará idempotente, mas não emitirá outra sessão. Isso impede que um link já utilizado se transforme em uma credencial reutilizável.
4. Tokens desconhecidos ou expirados continuarão retornando `400 INVALID_OR_EXPIRED_TOKEN`.
5. A Server Action persistirá a sessão somente no cookie `HttpOnly`; o token não será devolvido ao componente cliente.
6. Remover o fragmento com o token do histórico do navegador depois da confirmação.
7. Sincronizar DTOs, decorators Swagger e as asserções OpenAPI/E2E no mesmo commit.

## Experiência de confirmação

1. Impedir que o Effect de confirmação dispare duas chamadas no Strict Mode.
2. Substituir o formulário de reenvio pelo estado de sucesso depois da confirmação.
3. Mostrar a mensagem “Seu e-mail foi confirmado” e “Redirecionando para sua conta em 3”, atualizando o número a cada segundo em uma região `aria-live`.
4. Redirecionar com `router.replace` ao final da contagem.
5. Se o link já tiver sido confirmado e não houver mais sessão no navegador, preservar o sucesso e direcionar para o login correspondente, pois uma nova sessão não será emitida pelo token usado.
6. Manter o formulário de reenvio somente nos estados sem token, inválido ou expirado.

## Cabeçalho autenticado

1. Ler a sessão no servidor nas páginas `/` e `/search` usando `getCurrentUser` e passar apenas `AuthUser` aos componentes públicos.
2. Criar um componente reutilizável de conta com avatar por iniciais, nome truncado, papel em texto mais claro e indicador de abertura.
3. Usar o `DropdownMenu` oficial do registry `@shadcn`, baseado no Base UI já instalado, sem adicionar uma nova biblioteca de interface.
4. O menu exibirá a identidade da conta e a ação “Sair”, ligada à Server Action existente de logout.
5. Reutilizar o componente no cabeçalho público e no cabeçalho administrativo para manter a mesma interação.
6. Em telas estreitas, preservar o avatar e ocultar progressivamente os textos para não comprometer a busca nem causar overflow.

## Direção visual

- Cores: azul primário, papel branco, tinta escura, cinza de apoio e coral apenas para pequenos sinais da identidade Ticket Overlord.
- Tipografia: Instrument Sans para nome e ação, IBM Plex Mono para o rótulo do papel e Barlow Condensed somente onde já atua como display.
- Assinatura: o bloco de identidade se comportará como um pequeno canhoto de ingresso no cabeçalho, com avatar, duas linhas e menu compacto.
- Movimento: somente a contagem regressiva; sem animações decorativas adicionais.

## Validação

- Teste unitário do caso de uso de confirmação com criação de sessão somente na primeira chamada.
- Teste E2E PostgreSQL para confirmação, repetição idempotente, token inválido, cookie via Server Action e login pela sessão criada.
- Testes dos estados de confirmação, contagem regressiva e redirecionamento com timers controlados.
- Testes do cabeçalho como visitante e como cada papel autenticado, incluindo abertura do menu e logout.
- Verificação visual da confirmação e do cabeçalho em desktop e mobile.
- `pnpm lint`, `pnpm test`, `pnpm build` e `docker compose config --quiet`.

## Fora do escopo

- Página de perfil, edição de dados e troca de papel.
- Implementação da área de portaria ou convite de funcionários.
- Novas tabelas, migrations ou dependências de runtime.
- Deploy ou mudanças em produção.
