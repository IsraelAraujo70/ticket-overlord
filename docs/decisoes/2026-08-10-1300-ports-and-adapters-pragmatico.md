# Ports and adapters pragmático

- **Status:** Aceita
- **Decidida em:** 2026-08-10 13:00:57 -03:00

## Contexto

O sistema possui regras que não devem depender de HTTP ou de fornecedores externos, especialmente reserva, capacidade, pagamento, emissão e validação de ingressos. Ao mesmo tempo, uma implementação completa de arquitetura hexagonal para cada operação aumentaria o volume de código e o risco de não concluir o desafio.

## Decisão

Separar regras de domínio, casos de uso, infraestrutura e apresentação dentro dos módulos de negócio. Criar portas apenas para fronteiras reais ou variáveis, como:

- Catálogo externo.
- Busca de eventos.
- Pagamento simulado.
- Geração e verificação do código do ingresso.
- Persistência que precise ser substituída em testes ou coordenada em transações.

O domínio não importará NestJS, Drizzle ou tipos HTTP. Não serão criadas interfaces para classes que possuem apenas uma implementação e não representam uma fronteira relevante.

## Alternativas consideradas

### Arquitetura hexagonal completa

Rejeitada para o escopo inicial porque produziria abstrações e mapeamentos além do necessário para o prazo.

### Estrutura inteiramente orientada pelo framework

Rejeitada porque acoplaria regras críticas aos controllers, decorators e mecanismos de persistência.

## Consequências

- As regras críticas podem ser testadas sem iniciar o framework.
- Integrações podem evoluir sem reescrever os casos de uso.
- O projeto precisa revisar cada nova interface para evitar abstração especulativa.
- Transações que atravessam repositórios exigirão uma fronteira explícita de unidade de trabalho ou um adapter transacional equivalente.
