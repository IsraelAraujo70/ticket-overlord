# Evolução da busca

- **Status:** Aceita
- **Decidida em:** 2026-08-10 13:00:57 -03:00

## Contexto

A busca por eventos é obrigatória, mas o volume de dados do desafio não justifica inicialmente a operação de PostgreSQL, Elasticsearch, Debezium, Kafka e Kafka Connect. Essa infraestrutura pode demonstrar conhecimento de sistemas distribuídos, porém aumenta custo, pontos de falha e tempo de validação.

## Decisão

Implementar a primeira versão com PostgreSQL Full Text Search atrás de uma porta de busca.

Somente depois que o fluxo obrigatório estiver implementado, testado e publicado, considerar a seguinte evolução:

1. Criar um transactional outbox na mesma transação das alterações pesquisáveis.
2. Processar o outbox com um worker idempotente.
3. Manter um read model no Elasticsearch.
4. Documentar consistência eventual, reprocessamento e reconstrução do índice.

Debezium e infraestrutura de streaming serão avaliados posteriormente e não fazem parte do escopo inicial.

## Alternativas consideradas

### Elasticsearch desde o início

Rejeitado porque duplica dados e exige lidar com sincronização antes de o fluxo principal existir.

### Debezium com Kafka Connect

Adiado porque exige logical replication, broker, connector runtime, offsets e operação adicional no Railway.

### Busca simples com `ILIKE`

Pode servir como fallback temporário, mas Full Text Search expressa melhor a intenção e oferece uma evolução local sem adicionar outro serviço.

## Consequências

- A busca inicial permanece consistente com a fonte de verdade.
- O deploy inicial precisa de menos serviços e recursos.
- A porta de busca evita acoplamento do caso de uso ao mecanismo escolhido.
- Elasticsearch só será adicionado com critérios verificáveis de sincronização e recuperação.
