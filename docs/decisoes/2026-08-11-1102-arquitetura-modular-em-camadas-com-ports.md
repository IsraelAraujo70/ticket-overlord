# Arquitetura modular em camadas com ports nas fronteiras

- **Status:** Aceita
- **Decidida em:** 2026-08-11 11:02:05 -03:00
- **Substitui:** [Ports and adapters pragmático](./2026-08-10-1300-ports-and-adapters-pragmatico.md)

## Contexto

A primeira implementação do backend comprovou os contratos de autenticação, persistência e integrações, mas concentrou cadastro, organizações, confirmação de e-mail, sessões, recuperação de senha, queries Drizzle e entrega de mensagens em um único serviço. A base ainda é pequena, portanto este é o momento de estabelecer limites claros antes de implementar eventos, reservas, pagamentos e ingressos.

O NestJS favorece módulos por feature, controllers que delegam para providers e dependências compostas pelo container de injeção. Uma arquitetura hexagonal estrita em toda classe adicionaria cerimônia desnecessária, enquanto uma estrutura MVC ou apenas controller-service-repository deixaria regras importantes dependentes do framework e da persistência.

## Decisão

Adotar módulos por feature com quatro responsabilidades internas:

- **Presentation:** controllers, DTOs, guards, decorators e exception filters do NestJS.
- **Application:** casos de uso que coordenam regras e dependências sem conhecer HTTP, Drizzle ou fornecedores externos.
- **Domain:** políticas, tipos e erros de negócio sem imports do framework.
- **Infrastructure:** adapters de PostgreSQL/Drizzle, Resend, ViaCEP e demais integrações.

Aplicar ports apenas nas fronteiras que precisam proteger a aplicação de detalhes externos ou preservar contratos atômicos:

- Persistência e transações de cada feature.
- E-mail transacional.
- Consulta de endereço.
- Catálogo externo.
- Pagamento.
- Assinatura e verificação de códigos de ingresso.

Os ports devem expressar capacidades do negócio, não operações genéricas por tabela. Abstract classes podem servir simultaneamente como contrato TypeScript e token de injeção do NestJS quando isso reduzir a cerimônia. Não serão criados repositories base, interfaces para funções puras, módulos por caso de uso, CQRS ou event bus sem uma necessidade aprovada.

O módulo NestJS será o composition root da feature: ele conecta casos de uso aos adapters concretos. Controllers apenas validam e traduzem HTTP; adapters de persistência contêm SQL, Drizzle e transações; exception filters traduzem erros da aplicação para respostas HTTP.

## Aplicação inicial

A autenticação será a primeira feature ajustada integralmente:

- Separar cadastro, confirmação de e-mail, sessões e recuperação de senha em providers de aplicação.
- Introduzir um port de persistência que exponha operações atômicas do fluxo de identidade.
- Manter Console e Resend como adapters do port de e-mail existente.
- Centralizar configuração e validação das variáveis de ambiente.
- Remover queries Drizzle, tratamento HTTP e leitura direta de `process.env` dos casos de uso.
- Preservar métodos, caminhos, status e schemas públicos já documentados no Swagger.

As próximas features seguirão a mesma estrutura somente quando forem implementadas. A refatoração não criará diretórios vazios nem abstrações para escopo futuro.

## Alternativas consideradas

### Manter ports and adapters pragmático sem estrutura interna obrigatória

Substituída porque permitiu interpretações diferentes dentro da mesma feature e não impediu a concentração de diversas responsabilidades em um único service.

### MVC

Rejeitada porque a API não possui uma camada de view no backend e uma organização horizontal por controllers, services e models misturaria features conforme o produto crescesse.

### Controller, service e repository sem ports

Rejeitada como regra geral porque faria os casos de uso críticos conhecerem Drizzle e detalhes das integrações. Essa composição continua aceitável apenas para operações triviais sem regra relevante ou fronteira variável.

### Arquitetura hexagonal estrita

Rejeitada porque exigiria contratos, mapeamentos e tipos intermediários mesmo onde existe somente uma implementação simples e estável.

### CQRS

Rejeitada porque o volume e a complexidade atuais não justificam command bus, query bus ou event bus.

## Consequências

- O backend terá uma estrutura previsível e alinhada aos módulos e providers do NestJS.
- Casos de uso críticos poderão ser testados sem HTTP, PostgreSQL ou serviços externos.
- Transações continuarão explícitas, mas encapsuladas nos adapters de persistência.
- A quantidade de arquivos aumentará para separar responsabilidades, sem multiplicar abstrações genéricas.
- Novos módulos deverão justificar cada port como uma fronteira real.
- A refatoração precisa preservar o contrato Swagger e os testes E2E existentes antes de avançar para as próximas features.
