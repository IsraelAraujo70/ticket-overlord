# Swagger como fonte do contrato HTTP

- **Status:** Aceita
- **Data e hora da decisão:** 2026-08-10 14:05:54 -03:00

## Contexto

Os endpoints da API precisam ser testáveis em clientes como Bruno e compreensíveis sem exigir a leitura do código NestJS. A documentação também deve ser acessível no próprio backend para que desenvolvedores e avaliadores possam descobrir e executar requisições pelo navegador.

O NestJS consegue gerar um documento OpenAPI a partir dos DTOs, decorators e configuração da camada HTTP. Manter também um arquivo `docs/api/openapi.json` versionado duplicaria o contrato e exigiria sincronizar manualmente duas representações a cada alteração.

## Decisão

Os DTOs, decorators e a configuração do Swagger no código da API são a única fonte do contrato HTTP.

Usar `@nestjs/swagger` 11.4.6 para gerar OpenAPI 3.1 e servir:

- a interface Swagger UI em `GET /docs`;
- o documento OpenAPI em `GET /docs/openapi.json`.

O Bruno poderá importar diretamente a URL do documento enquanto a API estiver em execução. Os testes E2E validarão os métodos, respostas e schemas críticos do OpenAPI gerado. Não haverá collection Bruno separada nem snapshot OpenAPI versionado.

O script transitivo de telemetria de instalação do Scarf permanecerá explicitamente bloqueado na política `allowBuilds` do pnpm.

## Alternativas consideradas

### Manter o snapshot OpenAPI versionado

Rejeitada porque duplica o contrato gerado pelo NestJS e aumenta o custo de manutenção sem acrescentar uma fonte independente de verdade.

### Manter somente um documento OpenAPI estático

Rejeitada porque não oferece uma interface navegável no endereço da API e mantém a sincronização com os controllers inteiramente manual.

### Servir uma aplicação de documentação separada

Rejeitada porque adicionaria outro build e serviço para uma superfície que o NestJS consegue expor diretamente.

### Gerar e publicar um artefato OpenAPI no CI

Adiada. Pode ser útil quando houver consumidores externos ou geração de clientes, mas não é necessária no scaffold atual.

### Manter uma collection Bruno separada

Rejeitada porque criaria outra representação manual do mesmo contrato. A importação do OpenAPI servido já atende aos testes exploratórios.

## Consequências

- Alterações de contrato ficam concentradas nos DTOs, decorators e configuração da API.
- Testes E2E precisam acompanhar os aspectos críticos de cada contrato alterado.
- A documentação navegável acompanha o processo da API em todos os ambientes.
- O backend inclui a dependência e os assets do Swagger UI.
- O diff deixa de mostrar um snapshot JSON completo, mas mostra a implementação e suas asserções focadas.
- O Bruno precisa acessar uma API em execução para importar `http://localhost:3001/docs/openapi.json`.
- Expor a documentação revela intencionalmente o contrato público da API; segredos e valores sensíveis não podem aparecer nos exemplos.
- Um artefato estático poderá ser gerado futuramente sem voltar a ser uma segunda fonte manual de verdade.
