# Contrato HTTP com OpenAPI

- **Status:** Aceita
- **Decidida em:** 2026-08-10 13:52:16 -03:00

## Contexto

Os endpoints da API precisam ser testáveis em clientes como Bruno e compreensíveis sem leitura do código NestJS. A primeira superfície implementada ainda é pequena, portanto adicionar uma interface de documentação em runtime criaria dependência e configuração antes de haver contratos suficientes para justificá-las.

## Decisão

Versionar o contrato HTTP implementado em `docs/api/openapi.json`, usando OpenAPI 3.1.

O arquivo poderá ser importado no Bruno, Swagger Editor e outras ferramentas compatíveis. Toda mudança de método, caminho, parâmetros, autenticação, corpo, status ou resposta deverá atualizar o contrato na mesma alteração.

Não adicionar uma dependência de Swagger ao backend nesta etapa. A possibilidade de gerar e servir o documento a partir do NestJS será reavaliada quando a superfície HTTP crescer.

## Alternativas consideradas

### Coleção Bruno nativa

Rejeitada como fonte principal porque seria específica de um cliente. Bruno continua suportado por meio da importação do documento OpenAPI.

### Swagger UI servido pela API

Adiado porque exigiria dependência e inicialização adicionais no processo HTTP apenas para documentar o endpoint atual.

### Documentação apenas no README

Rejeitada porque texto livre não fornece um contrato estruturado e importável por ferramentas.

## Consequências

- Um único artefato atende Bruno, Swagger e outras ferramentas.
- O contrato permanece revisável em Git e não altera o runtime da API.
- A sincronização com o código é manual e obrigatória, reforçada pelas instruções do repositório.
- A validação precisa comparar o documento com controllers, testes e comportamento executado.
