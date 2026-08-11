# Cliente interno do backend no Next.js

## Resultado observável

O comportamento HTTP permanecerá igual. O cliente privado usado pelo Next.js para chamar o backend será identificado como `backend-client`, eliminando a ambiguidade com as rotas públicas em `app/api`.

## Implementação

1. Substituir `server/api/api-client.ts` por `server/backend-client.ts`.
2. Renomear os símbolos públicos para `backendBaseUrl`, `backendRequest` e `BackendRequestError`.
3. Marcar o módulo com `server-only` para impedir importação por componentes client-side.
4. Atualizar imports, mocks e chamadas existentes sem alterar os contratos HTTP.

## Validação

- Testes focados das Server Actions e Route Handler de CEP.
- `pnpm lint`, `pnpm test`, `pnpm build` e `git diff --check`.
- Busca garantindo que os nomes e o caminho antigos não permaneceram no frontend.

## Fora do escopo

- Alterar endpoints do Next.js ou NestJS.
- Alterar autenticação, banco de dados ou contratos públicos.
- Alterar o fluxo de catálogo.
