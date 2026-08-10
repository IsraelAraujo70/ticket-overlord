# Swagger servido pela API

- **Status:** Aceita
- **Decidida em:** 2026-08-10 14:02:33 -03:00
- **Substitui parcialmente:** [Contrato HTTP com OpenAPI](./2026-08-10-1352-contrato-http-openapi.md)

## Contexto

O contrato OpenAPI já pode ser importado em clientes externos, mas testar e explorar a API exige abrir outra ferramenta. Servir a documentação no próprio backend melhora a descoberta dos endpoints e permite que avaliadores executem requisições diretamente no navegador.

A decisão anterior adiou uma dependência de Swagger enquanto a superfície HTTP era pequena. Depois da validação do contrato estático, foi aprovada a disponibilização da interface em runtime.

## Decisão

Adicionar `@nestjs/swagger` 11.4.6 e servir:

- Swagger UI em `/docs`;
- OpenAPI JSON em `/docs/openapi.json`.

Gerar o documento a partir de metadados declarados nos controllers e DTOs da camada HTTP. Manter `docs/api/openapi.json` como artefato versionado para importação no Bruno e revisão em Git.

Um teste E2E comparará integralmente o JSON servido com o arquivo versionado. Qualquer mudança de contrato deverá atualizar os metadados no código e o documento estático na mesma alteração.

Bloquear explicitamente o script transitivo de telemetria de instalação do Scarf na política `allowBuilds` do pnpm.

## Alternativas consideradas

### Manter somente o arquivo estático

Substituída porque não oferece uma interface navegável ou execução de requisições no endereço da API.

### Servir uma aplicação de documentação separada

Rejeitada porque adicionaria outro build e serviço para uma superfície que o NestJS consegue expor diretamente.

### Gerar o contrato sem versionar o resultado

Rejeitada porque dificultaria a revisão de mudanças e a importação direta no Bruno sem executar a API.

## Consequências

- A documentação navegável acompanha o processo da API em todos os ambientes.
- O backend recebe uma dependência adicional e assets do Swagger UI.
- O teste E2E falha quando o contrato servido e o arquivo versionado divergem.
- Novos endpoints precisam de metadados OpenAPI antes de os gates passarem.
- Expor a documentação revela intencionalmente o contrato público da API; segredos e valores sensíveis não podem aparecer nos exemplos.
