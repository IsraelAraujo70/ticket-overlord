# Contrato da API

O arquivo [`openapi.json`](./openapi.json) é o contrato OpenAPI 3.1 versionado dos endpoints HTTP implementados pelo Ticket Overlord.

## Importar no Bruno

1. Inicie API e PostgreSQL com `pnpm dev:api` na raiz do repositório.
2. No Bruno, selecione **Import Collection**.
3. Escolha **OpenAPI** e selecione `docs/api/openapi.json`.
4. Execute `GET /` usando o servidor local `http://localhost:3001`.

O mesmo arquivo pode ser aberto no Swagger Editor ou em outras ferramentas compatíveis com OpenAPI 3.1.

## Swagger servido pela API

Com a API em execução, a documentação também fica disponível em:

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/openapi.json`

## Verificação rápida

Com a API em execução:

```bash
curl --fail --silent --show-error http://localhost:3001/
```

Resposta esperada:

```json
{"name":"ticket-overlord-api","status":"ok"}
```

## Manutenção

Qualquer mudança de método, caminho, parâmetros, autenticação, corpo, status HTTP ou formato de resposta deve atualizar os metadados OpenAPI no código e `openapi.json` na mesma alteração. O teste E2E compara integralmente o documento servido com o arquivo versionado e falha quando eles divergem.
