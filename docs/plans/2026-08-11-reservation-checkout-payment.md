# Reserva, checkout e pagamento simulado

- **Status:** Proposto
- **Criado em:** 2026-08-11 21:15:36 -03:00

## Resultado observável

Um cliente poderá abrir o detalhe de um evento publicado, escolher entre 1 e 10 ingressos e criar uma reserva que segura a quantidade por 10 minutos. Se não estiver autenticado, será direcionado ao login e retornará ao mesmo evento depois de entrar.

No checkout, o cliente verá o resumo e o tempo restante e poderá simular a aprovação ou a recusa do pagamento. A aprovação confirmará a compra uma única vez; a recusa ou a expiração liberará imediatamente a quantidade no cálculo de disponibilidade. Mesmo sob requisições concorrentes, o total reservado ou pago nunca ultrapassará a capacidade do evento.

## Escopo proposto

1. Expor o detalhe público de um evento publicado futuro, incluindo preço e disponibilidade atual.
2. Tornar os cartões do catálogo navegáveis para `/eventos/[slug]`.
3. Permitir que somente uma conta `CUSTOMER` autenticada reserve de 1 a 10 ingressos por evento.
4. Persistir reservas com snapshot do preço, quantidade, total, status e expiração de 10 minutos.
5. Implementar a alocação de inventário em uma transação PostgreSQL com locking explícito na linha do evento.
6. Exibir o checkout da própria reserva em `/checkout/[reservationId]`, com resumo e contagem regressiva baseada em `expiresAt` retornado pela API.
7. Persistir tentativas de pagamento e processá-las por uma porta `PaymentGateway` com adapter simulado interno.
8. Oferecer ações explícitas para simular aprovação e recusa, sem solicitar dados fictícios de cartão.
9. Tornar o pagamento idempotente por `Idempotency-Key` e impedir mais de um resultado terminal para a mesma reserva.
10. Manter Swagger, DTOs e asserções E2E sincronizados com todos os contratos HTTP novos ou alterados.

## Modelo de dados proposto

### Reservas

Criar `reservations` com:

- `id`, `eventId` e `customerId`.
- `quantity`, limitada de 1 a 10.
- `unitPriceInCents`, `totalInCents` e `currency` como snapshot da compra.
- `status`: `PENDING_PAYMENT`, `PAID`, `PAYMENT_REFUSED` ou `EXPIRED`.
- `expiresAt`, `createdAt` e `updatedAt`.

Indexar as consultas por evento e status, por cliente e criação e por expiração. O banco aplicará checks para quantidade e valores positivos; a API continuará responsável pelas mensagens de validação do contrato.

### Pagamentos

Criar `payments` com:

- `id`, `reservationId` e `customerId`.
- `amountInCents` e `currency` copiados da reserva.
- `status`: `APPROVED` ou `REFUSED`.
- `idempotencyKey`, `createdAt` e `processedAt`.

A combinação de cliente e chave de idempotência será única. Reutilizar a mesma chave com a mesma reserva e intenção retornará o resultado persistido; reutilizá-la com parâmetros diferentes retornará conflito.

## Concorrência e expiração

1. Iniciar uma transação no isolamento padrão `READ COMMITTED`.
2. Buscar e bloquear o evento publicado com `SELECT ... FOR UPDATE` antes de calcular disponibilidade.
3. Marcar como `EXPIRED` as reservas pendentes vencidas daquele evento.
4. Somar as quantidades `PENDING_PAYMENT` ainda válidas e `PAID`.
5. Rejeitar a operação se a quantidade solicitada exceder `capacity - allocatedQuantity`.
6. Inserir a reserva com expiração calculada pelo relógio do PostgreSQL e confirmar a transação.

Todas as operações que alterarem inventário usarão a ordem global de locks `evento -> reserva -> pagamento`. A reserva nova precisa somente do lock do evento; o pagamento lê o vínculo sem lock para localizar o evento e, dentro da transação, bloqueia e valida novamente o evento antes da reserva. Cancelamento e emissão futuros deverão preservar a mesma ordem. Isso evita inversão de locks e serializa somente as compras do mesmo evento, sem bloquear eventos independentes.

Não haverá worker de expiração nesta etapa. A liberação será lógica e imediata porque leituras e transações de inventário ignorarão reservas pendentes vencidas. O status persistido mudará para `EXPIRED` de forma oportunista durante uma reserva, pagamento ou leitura da própria reserva; portanto, poderá permanecer temporariamente como `PENDING_PAYMENT` sem consumir disponibilidade.

## Pagamento e idempotência

- O frontend gerará uma chave UUID para uma tentativa e a reutilizará enquanto repetir a mesma requisição.
- `POST /reservations/:reservationId/payment` exigirá `Idempotency-Key` e a intenção simulada `APPROVED` ou `REFUSED`.
- Dentro da transação, o adapter bloqueará o evento e depois a reserva, validará novamente propriedade, estado e expiração e buscará um resultado já persistido para a chave.
- A tentativa será inserida com `INSERT ... ON CONFLICT DO NOTHING`. Quando outra transação tiver usado a mesma chave, o adapter aguardará sua conclusão, lerá o resultado persistido e retornará o replay ou conflito por parâmetros diferentes.
- Uma reserva vencida será marcada como `EXPIRED` e não poderá ser paga.
- Uma aprovação mudará a reserva de `PENDING_PAYMENT` para `PAID` e manterá a quantidade alocada.
- Uma recusa mudará a reserva para `PAYMENT_REFUSED` e liberará a quantidade imediatamente.
- Estados terminais não poderão receber uma nova tentativa. Um replay idempotente continuará retornando o primeiro resultado.

## Contratos planejados

- `GET /events/published/:slug`: retorna o evento público futuro com `availableQuantity` e `maxQuantityPerReservation`, ou `404` quando o slug não identificar um evento disponível para venda.
- `POST /reservations`: recebe `{ eventId, quantity }`, exige `CUSTOMER` e retorna `201` com identificador, valores, quantidade, status e `expiresAt` da reserva pendente.
- `GET /reservations/:reservationId`: retorna os mesmos dados e o resumo do evento somente para o cliente proprietário.
- `POST /reservations/:reservationId/payment`: recebe `{ outcome: "APPROVED" | "REFUSED" }`, exige o header UUID `Idempotency-Key` e retorna o pagamento e o estado atualizado da reserva.

Os contratos distinguirão campos inválidos (`400`), sessão ausente (`401`), papel sem permissão (`403`), recurso não encontrado ou não pertencente ao cliente (`404`) e conflitos de inventário, expiração, estado ou idempotência (`409`).

## Backend

- Criar o módulo `checkout` com responsabilidades de `presentation`, `application`, `domain` e `infrastructure`.
- Manter regras de quantidade, estado e transição no domínio, sem imports de NestJS ou Drizzle.
- Criar uma porta transacional orientada à capacidade de reservar e pagar; o adapter Drizzle conterá a transação e o SQL de locking.
- Criar `PaymentGateway` como porta externa e `SimulatedPaymentGateway` como adapter determinístico.
- Estender a leitura pública de eventos sem expor rascunhos, eventos iniciados ou dados privados do organizador.
- Usar o relógio do PostgreSQL como autoridade para disponibilidade e expiração persistidas.

## Frontend

- Criar `/eventos/[slug]` dentro da superfície pública existente.
- Substituir `Venda em breve` por uma ação para ver e comprar ingressos.
- Exibir seletor acessível de quantidade, total e disponibilidade, adaptado para desktop e mobile.
- Direcionar sessões ausentes para `/login` com um retorno local validado, sem aceitar redirecionamentos externos.
- Criar `/checkout/[reservationId]` protegido para o resumo, prazo restante e simulação do pagamento.
- Desabilitar novas submissões enquanto uma tentativa estiver em andamento e reutilizar a chave idempotente em retries da mesma tentativa.
- Apresentar aprovação, recusa, expiração e indisponibilidade como resultados distintos e recuperáveis.

## Decisões e dependências

- Usar PostgreSQL `SELECT ... FOR UPDATE`, conforme a direção já aprovada de manter locking crítico explícito em SQL.
- Usar pagamento simulado interno conforme [`Pagamento simulado interno antes de provedor externo`](../decisoes/2026-08-11-2115-pagamento-simulado-interno.md).
- Não adicionar dependências. UUID, fetch, transações e relógios disponíveis na plataforma e nas dependências existentes são suficientes.

## Fora do escopo

- Stripe, outro provedor real, webhooks ou dados de cartão.
- Emissão de ingressos, QR Code, Meus Ingressos e compartilhamento.
- Cancelamento manual ou alteração de quantidade de uma reserva existente.
- Edição de preço ou capacidade de eventos com vendas iniciadas.
- Worker, fila ou job periódico para expiração.
- Seat map, assentos numerados ou múltiplos setores.
- Gestão administrativa de reservas e pagamentos.

## Validação

- Testes unitários das regras de quantidade, estados, expiração e transições de pagamento.
- Testes do adapter simulado e dos replays com a mesma chave de idempotência.
- Teste E2E com PostgreSQL real disparando reservas concorrentes cuja soma excede a capacidade e comprovando que apenas a quantidade disponível é aceita.
- Testes E2E comprovando que expiração e recusa devolvem inventário, aprovação mantém inventário e pagamentos repetidos não duplicam efeitos.
- Teste E2E com duas requisições concorrentes usando a mesma chave, comprovando que somente um pagamento é persistido e ambas observam o mesmo resultado.
- Testes E2E de autenticação, papel `CUSTOMER`, propriedade da reserva e distinção dos erros HTTP.
- Asserções focadas do OpenAPI para paths, autenticação, header, corpos, status e schemas.
- Testes de componentes e Server Actions para detalhe, login com retorno, quantidade, countdown e resultados de pagamento.
- Verificação visual responsiva do detalhe e checkout em viewport mobile e desktop.
- `pnpm lint`, `pnpm test`, `pnpm build`, `docker compose config --quiet` e `git diff --check` sob Node.js 24.

## Sequência de implementação

1. Migration, schemas e regras de domínio.
2. Adapter transacional e testes concorrentes no PostgreSQL.
3. Casos de uso e contratos HTTP de detalhe e reserva.
4. Pagamento simulado, idempotência e contratos HTTP.
5. Detalhe público, retorno do login e checkout no Next.js.
6. Seed, documentação, validação visual e gates finais.
