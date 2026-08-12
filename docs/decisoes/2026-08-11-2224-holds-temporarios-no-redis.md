# Holds temporários de inventário no Redis

- **Status:** Aceita
- **Decidida em:** 2026-08-11 22:24:31 -03:00
- **Substitui parcialmente:** [Reserva, checkout e pagamento simulado](../plans/2026-08-11-reservation-checkout-payment.md), somente quanto à persistência de reservas pendentes e ao locking de inventário no PostgreSQL.

## Contexto

O checkout implementado inicialmente persiste reservas pendentes no PostgreSQL e serializa compras do mesmo evento com `SELECT ... FOR UPDATE`. Esse desenho garante consistência em múltiplas instâncias, mas concentra no banco durável todas as tentativas durante picos de venda.

Para uma venda de alta demanda, o produto deve absorver milhares de tentativas concorrentes sem transformar cada hold temporário em escrita e contenção no PostgreSQL. Holds de dez minutos são efêmeros por natureza; compras aprovadas, pagamentos e ingressos continuam exigindo persistência durável e auditável.

## Decisão

- Usar Redis como autoridade operacional temporária dos holds e da disponibilidade durante a venda.
- Manter PostgreSQL como fonte de verdade durável para eventos, capacidade, compras confirmadas, pagamentos e ingressos.
- Criar e liberar holds por operações Lua atômicas, sem lock distribuído na aplicação.
- Dar a cada hold TTL lógico de dez minutos e registrar sua expiração também em um sorted set por evento.
- Em pagamento recusado, liberar imediatamente o hold e devolver sua quantidade ao inventário em uma única operação Redis.
- Em pagamento aprovado, mover o hold para `PROCESSING`, persistir reserva confirmada e pagamento no PostgreSQL em transação idempotente e finalizar o hold sem devolver quantidade.
- Não persistir holds em disco no Redis. Um restart cancela todos os holds pendentes e recompõe a disponibilidade a partir da capacidade e das compras confirmadas no PostgreSQL.
- Falhar fechado com `503` quando o Redis estiver indisponível. Não haverá fallback para o locking PostgreSQL anterior.
- Não depender de keyspace notifications para correção do inventário. Toda operação limpa expirações vencidas, complementada por um sweeper idempotente.

## Alternativas consideradas

### Redis apenas como cache de leitura

Rejeitada porque reduziria consultas do checkout depois da reserva, mas não retiraria do PostgreSQL a contenção durante a criação concorrente dos holds.

### Persistir primeiro no PostgreSQL e copiar para Redis

Rejeitada porque manteria escrita e locking no caminho mais disputado e criaria duas representações de uma reserva ainda não confirmada.

### Fallback automático para PostgreSQL

Rejeitado porque dois mecanismos de alocação ativos poderiam vender a mesma capacidade sem uma coordenação adicional. Durante indisponibilidade do Redis, novas reservas serão recusadas temporariamente.

### AOF no Redis

Adiado. Os holds foram deliberadamente classificados como efêmeros. Reiniciar o Redis cancela carrinhos não pagos, comportamento aceitável nesta etapa e explicitado na interface e documentação.

### Expiração baseada somente no TTL da chave

Rejeitada porque a remoção automática de uma chave não devolve por si só a quantidade ao contador, e notificações de expiração são fire-and-forget e podem atrasar ou ser perdidas.

## Consequências

- O PostgreSQL deixa de receber uma escrita e um lock por tentativa de reserva.
- Redis passa a ser uma dependência crítica do checkout, mas não contém compras duráveis.
- Um restart ou perda total do Redis cancela holds pendentes; compras aprovadas continuam preservadas no PostgreSQL.
- A atomicidade cobre operações internas de cada sistema, não uma transação distribuída entre Redis e PostgreSQL. IDs estáveis, estados idempotentes e reconciliação tratam falhas entre as duas etapas.
- Aprovações usam fencing token no Redis e advisory lock por hold no PostgreSQL para impedir que um reconciliador libere inventário durante uma transação em andamento.
- O contador confirmado no Redis é monotônico e reconciliado por totais absolutos do PostgreSQL; snapshots antigos nunca podem reduzi-lo.
- Inicialização e reconstrução bloqueiam novos holds e usam o mesmo advisory lock de evento das aprovações, eliminando a janela entre a fotografia PostgreSQL e a ativação do inventário Redis.
- Holds `PROCESSING` não expiram fisicamente; um índice de reconciliação preserva fencing token e quantidade até confirmação ou liberação explícita.
- Redis Cluster não faz parte desta etapa. O índice global de hold e o sweeper pressupõem uma única instância Redis.
- O serviço precisa testar concorrência, expiração, recusa, aprovação, retry depois de falhas e reconstrução após `FLUSHDB` usando Redis e PostgreSQL reais.
- A introdução do Redis não autoriza Kafka, Debezium, Elasticsearch, microsserviço separado ou outras expansões de infraestrutura.
