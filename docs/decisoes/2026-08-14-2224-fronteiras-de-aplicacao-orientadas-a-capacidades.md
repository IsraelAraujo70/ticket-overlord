# Fronteiras de aplicação orientadas a capacidades

- **Status:** Aceita
- **Decidida em:** 2026-08-14 22:24:24 -03:00
- **Complementa:** [Arquitetura modular em camadas com ports nas fronteiras](./2026-08-11-1102-arquitetura-modular-em-camadas-com-ports.md)

## Contexto

A evolução de eventos, checkout, busca e ingressos preservou os diretórios de apresentação, aplicação, domínio e infraestrutura, mas alguns contratos cresceram para atender consumidores diferentes. O checkout também passou a entregar um `PoolClient` do PostgreSQL ao port de ingressos para manter reserva, pagamento e emissão na mesma transação. Essa solução preservou atomicidade, porém expôs um detalhe concreto de infraestrutura à camada de aplicação.

Alguns tipos de persistência e apresentação também permaneceram no domínio, e a reconciliação de holds ficou coordenada pelo scheduler do Redis. O resultado funciona, mas enfraquece as fronteiras que a arquitetura modular pretende proteger.

## Decisão

- Ports de aplicação serão segregados por capacidade e consumidor, sem repositories genéricos ou uma interface por método.
- A confirmação de checkout continuará sendo uma única transação PostgreSQL, incluindo reserva, pagamento e emissão de ingressos, mas o contrato de aplicação não receberá tipos do driver `pg`.
- O adapter transacional de checkout será responsável por compor as operações SQL necessárias para o commit atômico.
- O scheduler permanecerá na infraestrutura, enquanto a política de reconciliação será um caso de uso da aplicação.
- Durações de hold e processamento serão políticas explícitas do checkout e serão passadas ao adapter Redis.
- Read models e modelos de persistência ficarão em application ou infrastructure. O domínio manterá regras, estados, erros e valores de negócio.
- O typecheck sem emissão, incluindo testes unitários, será um gate obrigatório do workspace.

## Alternativas consideradas

### Unidade de trabalho genérica

Rejeitada porque introduziria uma abstração transacional ampla e exporia operações técnicas sem benefício para os demais módulos.

### Compartilhar o client PostgreSQL entre ports

Rejeitada porque mantém a atomicidade ao custo de acoplar contratos de aplicação ao driver e permitir coordenação de infraestrutura entre features.

### Transações separadas para pagamento e ingressos

Rejeitada porque permitiria pagamentos confirmados sem todos os ingressos emitidos.

### Hexagonal estrita em todas as classes

Rejeitada novamente. A mudança permanece incremental e cria ports apenas para capacidades usadas por casos de uso ou fronteiras externas reais.

## Consequências

- Checkout e ingressos continuam atomicamente consistentes.
- Casos de uso não conhecem PostgreSQL, Redis, HTTP ou storage.
- Adapters concretos podem implementar vários ports coesos.
- Testes usam somente as capacidades consumidas pelo caso de uso.
- A quantidade de contratos aumenta moderadamente, compensada pela redução de mocks e dependências acidentais.
