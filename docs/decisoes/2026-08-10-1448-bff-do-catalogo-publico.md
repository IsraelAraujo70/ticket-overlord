# BFF do catálogo público

- Status: Aceita
- Data da decisão: 2026-08-10 14:48:25 -03:00

## Contexto

A landing page pública precisa consumir um catálogo por HTTP desde a primeira versão, mas a rota definitiva do backend NestJS ainda não existe. Colocar dados demonstrativos diretamente nos componentes React criaria acoplamento entre apresentação e fonte de dados, além de exigir uma reescrita maior quando a API estiver disponível.

## Decisão

O `apps/web` expõe temporariamente `GET /api/catalog` como um Backend for Frontend por meio de um Route Handler do Next.js. O endpoint aceita o parâmetro opcional `query`, normaliza a resposta em destaque, seções e metadados, e lê uma fonte mock isolada no servidor.

Os componentes públicos acessam somente esse contrato por `fetch`. Quando a rota definitiva do `apps/api` estiver disponível, a fonte mock será substituída por um adaptador HTTP dentro da camada de servidor do `apps/web`, preservando o contrato consumido pela interface.

## Alternativas consideradas

### Mock direto nos componentes

Rejeitada porque mistura dados, consulta e renderização, dificultando estados de carregamento, erro e vazio e aumentando o custo da integração futura.

### Consumir imediatamente uma rota incompleta do `apps/api`

Rejeitada porque bloquearia a entrega visual e introduziria um contrato ainda não definido no backend.

### Biblioteca externa de mock HTTP

Rejeitada nesta etapa porque o Route Handler e as APIs nativas já cobrem o comportamento necessário sem uma dependência adicional.

## Consequências

- A interface já exercita uma fronteira HTTP real e estados assíncronos.
- O mock permanece restrito ao servidor do frontend e não entra no bundle dos componentes.
- A busca atual é demonstrativa e ocorre em memória.
- A troca futura para o NestJS fica concentrada na fonte do catálogo.
- O contrato do BFF precisa permanecer coberto por testes enquanto for consumido pela landing page.
