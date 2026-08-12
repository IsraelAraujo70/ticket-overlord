# Pagamento simulado interno antes de provedor externo

- **Status:** Aceita
- **Decidida em:** 2026-08-11 21:15:36 -03:00

## Contexto

O challenge exige que o checkout trate confirmação e recusa, mas permite tanto uma simulação interna quanto o ambiente de testes de um provedor real. Stripe em modo de testes ainda exigiria conta, credenciais, SDK, Payment Intents, webhooks assinados, idempotência distribuída e configuração adicional para o avaliador.

O fluxo obrigatório ainda precisa entregar reserva concorrente, emissão e compartilhamento de ingressos, QR Code e validação atômica na portaria. A integração com um provedor externo neste momento aumentaria o risco de não concluir essas capacidades dentro do prazo sem ser necessária para o critério de sucesso.

## Decisão

- Implementar um `PaymentGateway` orientado à capacidade de processar uma tentativa de pagamento.
- Usar inicialmente um `SimulatedPaymentGateway` interno e determinístico.
- Permitir que o checkout escolha explicitamente entre aprovação e recusa para que o avaliador exercite os dois resultados sem números de cartão especiais.
- Persistir cada resultado e proteger a operação com uma chave de idempotência gerada pelo cliente.
- Tratar aprovação e recusa como estados terminais da reserva; a recusa libera o inventário imediatamente.
- Não coletar dados fictícios de cartão, pois não haverá processamento financeiro real.

## Alternativas consideradas

### Stripe em modo de testes

Adiado. Demonstraria uma integração conhecida, mas introduziria credenciais, SDK, Payment Intents, webhooks e falhas externas antes de o fluxo obrigatório estar completo. Poderá substituir o adapter simulado depois que ingressos e portaria estiverem entregues.

### Simulação acoplada ao controller

Rejeitada porque misturaria o mecanismo de demonstração ao contrato HTTP e às transições críticas de reserva. A porta mantém o caso de uso independente do simulador sem criar uma arquitetura genérica de pagamentos.

### Aprovação automática de toda tentativa

Rejeitada porque não permitiria ao avaliador verificar claramente o caminho obrigatório de recusa.

## Consequências

- Confirmação, recusa e idempotência poderão ser testadas de forma rápida e determinística sem serviços externos.
- O setup não exigirá conta ou credenciais de pagamento.
- O produto deixará explícito que a cobrança é simulada e não solicitará dados financeiros.
- Uma futura integração Stripe deverá implementar a mesma capacidade e acrescentar tratamento assíncrono de webhook antes de substituir o adapter.
- A entrega inicial não demonstrará uma integração financeira real, limitação aceitável e documentada pelo próprio challenge.
