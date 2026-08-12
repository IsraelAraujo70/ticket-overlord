# Holds de inventário no Redis

- **Status:** Proposto
- **Criado em:** 2026-08-11 22:24:31 -03:00

## Resultado observável

Ao escolher de 1 a 10 ingressos, o cliente criará um hold de dez minutos no Redis sem inserir uma reserva pendente no PostgreSQL. Milhares de tentativas para o mesmo evento serão serializadas por uma operação Lua curta e atômica; a soma de holds ativos e compras confirmadas nunca ultrapassará a capacidade.

Uma recusa liberará o hold imediatamente. Uma aprovação gravará no PostgreSQL uma reserva `PAID` e um pagamento `APPROVED` em uma transação idempotente e finalizará o hold sem devolver estoque. Se Redis estiver indisponível, criação, leitura e pagamento de holds responderão `503`, sem fallback silencioso.

## Escopo proposto

1. Provisionar Redis local e de testes no Compose e configurar `REDIS_URL` na API.
2. Adicionar o cliente oficial `redis` para Node.js, com conexão no ciclo de vida do NestJS, handler de erro, timeout e offline queue desabilitada.
3. Separar as capacidades `InventoryHoldStore` e `ConfirmedCheckoutStore`, evitando uma porta única que misture Redis e PostgreSQL.
4. Implementar criação, leitura, transição para processamento, liberação, confirmação e limpeza de holds com scripts Lua versionados no código.
5. Alterar disponibilidade pública para `capacity - confirmedQuantity - heldQuantity`, usando Redis no caminho de leitura.
6. Remover do PostgreSQL a persistência de `PENDING_PAYMENT`, `PAYMENT_REFUSED` e `EXPIRED`; `reservations` passa a representar somente compras confirmadas `PAID`.
7. Preservar os contratos HTTP atuais sempre que o significado continuar compatível, ajustando schemas e códigos somente onde o hold efêmero exigir.
8. Adaptar o checkout para tratar hold perdido após restart como expirado e orientar uma nova tentativa.
9. Implementar um sweeper idempotente no processo da API para liberar expirações sem depender de notificações Redis.
10. Manter Swagger, testes E2E e documentação sincronizados.

## Modelo Redis

Esta etapa usará uma única instância Redis. Os scripts podem acessar todas as chaves atomicamente, sem alegar compatibilidade com Redis Cluster:

- `inventory:{eventId}`: hash com `state=INITIALIZING|READY`, `capacity`, `confirmed`, `held` e versão da reconstrução.
- `hold:{eventId}:{holdId}`: hash sem TTL físico, com cliente, quantidade, preço, moeda, estado, token da operação e timestamps. Somente scripts de cleanup, recusa ou confirmação removem esse payload.
- `hold-expirations:{eventId}`: sorted set cujo membro codifica `holdId` e quantidade e cujo score é `expiresAt` em epoch milliseconds.
- `processing-holds`: sorted set cujo membro codifica `eventId`, `holdId`, quantidade, fencing token e operação e cujo score define quando o reconciliador deve verificar o processamento interrompido.
- `hold-owner:{holdId}`: string sem expiração automática enquanto o hold existir, apontando para `eventId`, para localização sem `KEYS` ou `SCAN` no caminho HTTP.
- `active-hold-events`: sorted set global com o próximo vencimento de cada evento, usado pelo sweeper para descobrir trabalho.

O hold terá ID UUID gerado antes da operação e os estados `PENDING` ou `PROCESSING`. `PROCESSING` armazenará a chave idempotente, outcome, fencing token monotônico e início da operação. Holds finalizados serão removidos; resultados duráveis serão consultados no PostgreSQL pelo mesmo ID.

Não usar `KEYS`, keyspace notifications nem um contador que dependa da remoção automática isolada de uma chave.

Redis Cluster fica fora do escopo. Uma evolução para Cluster precisará mudar o identificador HTTP para carregar o `eventId` ou redesenhar o índice `hold-owner`, pois ele não compartilha hash slot com as chaves do evento.

## Scripts atômicos

### Criar hold

1. Limpar membros vencidos `PENDING`; somente um `ZREM` bem-sucedido autoriza subtrair a quantidade codificada no membro de `held`, mantendo o contador nunca negativo.
2. Exigir `inventory.state=READY`; enquanto estiver ausente ou `INITIALIZING`, recusar criação sem alterar inventário.
3. Validar `capacity` e reconciliar `confirmed = max(confirmed atual, confirmed informado pela aplicação)`.
4. Calcular `available = capacity - confirmed - held`.
5. Rejeitar quantidade inválida ou inventário insuficiente.
6. Gravar o hold `PENDING`, incrementar `held`, adicionar a expiração, atualizar `active-hold-events` e criar o índice `hold-owner` na mesma execução.
7. Retornar o hold e a disponibilidade restante.

### Preparar pagamento

1. Limpar expirados do evento.
2. Validar hold, proprietário, estado e prazo.
3. Se `PENDING`, mudar para `PROCESSING`, registrar a operação idempotente e incrementar seu fencing token; mover sua entrada de expiração para `processing-holds`, cujo membro preserva dados suficientes para reconciliação mesmo se outro índice estiver inconsistente.
4. Se já `PROCESSING` pela mesma chave, outcome e fencing token, retornar replay seguro; parâmetros diferentes retornam conflito.
5. Se a compra já existir no PostgreSQL com o mesmo ID, permitir apenas a finalização Redis.

### Recusar ou liberar

1. Validar hold, proprietário e, para `PROCESSING`, fencing token da operação.
2. Remover o hold e sua expiração; somente a primeira remoção bem-sucedida altera contadores.
3. Subtrair a quantidade de `held` imediatamente, sem permitir valor negativo.
4. Remover `hold-owner`.
5. Tornar repetição idempotente.

### Confirmar

1. Executar somente depois do commit PostgreSQL.
2. Remover o hold e sua expiração.
3. Subtrair a quantidade de `held` e reconciliar `confirmed = max(confirmado Redis, total confirmado PostgreSQL)` na mesma operação.
4. Remover `hold-owner`.
5. Tornar repetição idempotente consultando o total confirmado reconstruível pelo PostgreSQL.

Os scripts serão carregados pelo cliente e executados por SHA com fallback de recarga quando o cache de scripts for perdido. Membros obsoletos, payloads ausentes e chamadas repetidas não poderão subtrair `held` mais de uma vez.

## Aprovação entre Redis e PostgreSQL

Não haverá transação distribuída. O fluxo será convergente e idempotente:

1. Usar `holdId` também como ID da futura reserva; a operação guarda separadamente `Idempotency-Key`, outcome e fencing token.
2. Consultar primeiro a compra PostgreSQL por `holdId`. Resultado existente com os mesmos parâmetros é replay; parâmetros diferentes são conflito.
3. Marcar o hold como `PROCESSING` no Redis e obter o fencing token.
4. Abrir uma transação PostgreSQL e adquirir `pg_advisory_xact_lock` derivado de `holdId`, compartilhado pelo pagamento e pelo reconciliador.
5. Depois do advisory lock, revalidar no Redis que o mesmo fencing token ainda possui o hold antes de inserir.
6. Inserir `reservations(PAID)` e `payments(APPROVED)` com unicidade por reserva e chave idempotente e confirmar a transação.
7. Após o commit, finalizar o hold no Redis sem devolver estoque, informando a soma confirmada atual do PostgreSQL.
8. Se a finalização Redis falhar, o retry encontra a compra no PostgreSQL e conclui a limpeza; se o Redis tiver sido perdido, reconcilia apenas o contador confirmado e retorna o resultado durável.
9. Se PostgreSQL falhar antes do commit, a mesma operação pode devolver `PROCESSING` a `PENDING` usando seu fencing token. Conexão ambígua exige consulta PostgreSQL antes de qualquer liberação.
10. Holds `PROCESSING` não são liberados somente por tempo no Lua. O reconciliador adquire o mesmo advisory lock, consulta PostgreSQL e então confirma ou libera com o fencing token; assim não pode liberar enquanto a transação original estiver em andamento.

## Inicialização e recuperação

- O primeiro acesso marca `inventory.state=INITIALIZING` e mantém criação de holds bloqueada. Em uma transação PostgreSQL, adquire o advisory lock do evento compartilhado com todas as aprovações, lê capacidade, preço e soma de reservas `PAID`, inicializa os contadores Redis e só então muda o estado para `READY`, ainda sob o lock. Uma aprovação não pode commitar durante essa fotografia, e nenhum hold pode usar inventário incompleto.
- Aprovações normais também adquirem o advisory lock do evento e reconciliam pelo total absoluto do PostgreSQL, nunca por snapshot decrescente.
- Um `FLUSHDB` ou restart do Redis cancela todos os holds pendentes. O próximo acesso reconstrói `confirmed` pelo PostgreSQL e começa com `held = 0`. Uma aprovação em andamento consulta a compra durável pelo `holdId`; se houve commit, retorna sucesso e eleva o confirmado monotonicamente, sem exigir que o hold ainda exista.
- Como este ambiente ainda não é produção, uma migration transacional e irreversível removerá primeiro pagamentos `REFUSED` e depois reservas `PENDING_PAYMENT`, `PAYMENT_REFUSED` e `EXPIRED`, preservando reservas `PAID` e pagamentos `APPROVED`. O plano não inclui rollback desses dados demonstrativos descartados.
- Redis usará política `noeviction`; ao atingir memória, novas reservas falham em vez de expulsar holds ativos silenciosamente.
- Estruturas incompletas, `held` negativo, ausência inesperada de inventário ou divergência de capacidade movem o evento para `INITIALIZING`; nenhuma disponibilidade parcial ou criação de hold será permitida até reconstrução sob advisory lock.
- Se PostgreSQL estiver indisponível durante inicialização, reconciliação ou aprovação, a operação falha fechada com `503` e nunca assume zero compras confirmadas.

## Contratos HTTP

- `GET /events/published/:slug`: mantém o contrato e calcula `availableQuantity` com compras PostgreSQL e holds Redis.
- `POST /reservations`: mantém o path por compatibilidade, mas cria e retorna um hold efêmero com `status=PENDING_PAYMENT` e `expiresAt`.
- `GET /reservations/:reservationId`: retorna o hold do proprietário; se não existir no Redis, consulta compra confirmada no PostgreSQL; caso contrário retorna `404` com código de hold expirado.
- `POST /reservations/:reservationId/payment`: mantém intenção simulada e `Idempotency-Key`; aprovação persiste compra, recusa libera hold.

Adicionar `503` documentado para indisponibilidade do Redis nos contratos dependentes de holds. Não expor chaves Redis ou detalhes de scripts no HTTP.

## Infraestrutura e configuração

- Adicionar `redis:8-alpine` e `redis-test:8-alpine` ao Compose com healthchecks.
- Redis local rodará sem volume e com `appendonly no`, `save ""` e `maxmemory-policy noeviction`.
- `infra:up` e `test:infra:up` deverão aguardar Redis e Redis de teste.
- Validar `REDIS_URL` no startup da API e documentá-la no `.env.example` e setup.
- O Compose de produção deverá conectar a API ao serviço Redis, sem publicar a porta externamente.
- Provisionamento ou alteração em Railway exige confirmação imediata separada e não faz parte da implementação local deste plano.

## Dependência aprovada

- `redis`, cliente oficial recomendado para Node.js, com suporte a TypeScript e scripts.

Nenhuma biblioteca adicional de lock, fila, scheduler ou cache será adicionada.

## Sweeper

- Executar em intervalo curto consultando `active-hold-events`, que registra o próximo vencimento dos eventos com holds.
- Cada execução chama o mesmo script idempotente de limpeza; múltiplas instâncias podem executar simultaneamente sem dupla devolução.
- O reconciliador também consome `processing-holds`, adquire o advisory lock do evento, consulta a compra pelo `holdId` e confirma ou libera usando o fencing token codificado no membro.
- O caminho correto não depende do sweeper: criação, leitura, recusa e pagamento sempre limpam expirados antes de calcular inventário.
- Encerrar o intervalo no ciclo de shutdown da aplicação.

## Fora do escopo

- Redis como fonte durável de compras ou pagamentos.
- AOF, réplica, Sentinel ou Redis Cluster nesta etapa.
- Fallback de reserva no PostgreSQL.
- Kafka, Debezium, Elasticsearch, outbox ou microsserviço separado.
- Stripe, webhooks reais ou dados de cartão.
- Rate limiting, waiting room ou proteção de borda.
- Ingressos, QR Code, compartilhamento e portaria.

## Validação

- Testes unitários das transições de hold e coordenação de aprovação.
- Testes dos scripts contra Redis real, incluindo criação concorrente acima da capacidade, cleanup, recusa, confirmação e idempotência.
- Testes E2E com Redis e PostgreSQL reais comprovando que criação de hold não insere no PostgreSQL.
- Teste E2E de milhares de tentativas concorrentes com capacidade pequena, comprovando ausência de oversell e ausência de locks de inventário no PostgreSQL.
- Teste de inicialização concorrente com aprovação PostgreSQL, comprovando que nenhum hold é aceito em `INITIALIZING` e que `confirmed` nunca regride.
- Testes de expiração lógica mesmo sem keyspace notifications e com sweeper interrompido.
- Testes com membro obsoleto no sorted set, índice de owner ausente e cleanup repetido, comprovando que `held` não fica negativo.
- Testes de recusa liberando imediatamente e aprovação persistindo uma única reserva e um único pagamento.
- Testes da mesma reserva com chave ou outcome conflitantes e do fencing token sob pagamento lento.
- Teste de crash em `PROCESSING`, seguido de reconciliação pelo membro autossuficiente de `processing-holds` sem vazamento de inventário.
- Testes de falha depois do commit PostgreSQL e antes da finalização Redis, com retry convergindo sem duplicar compra.
- Teste de `FLUSHDB` exatamente entre commit PostgreSQL e finalização Redis.
- Teste de restart ou `FLUSHDB`: holds somem, compras confirmadas permanecem e inventário é reconstruído.
- Teste de Redis indisponível retornando `503` sem fallback.
- Teste de PostgreSQL indisponível durante inicialização retornando `503` sem publicar disponibilidade parcial.
- Teste da migration com todos os estados e pagamentos associados, preservando somente compras aprovadas.
- Asserções OpenAPI para o novo `503` e schemas ajustados.
- Testes web para hold expirado após restart e preservação dos resultados aprovados.
- `pnpm lint`, `pnpm test`, `pnpm build`, `docker compose config --quiet` e `git diff --check` sob Node.js 24.
- Validação visual do checkout em desktop e mobile.

## Sequência de implementação

1. Redis no Compose, configuração da API e cliente oficial.
2. Portas separadas, modelo de chaves e scripts Lua com testes Redis reais.
3. Leitura de disponibilidade e criação de hold sem escrita PostgreSQL.
4. Recusa imediata e sweeper idempotente.
5. Aprovação convergente entre Redis e PostgreSQL.
6. Migration para manter apenas compras confirmadas e adaptação dos contratos.
7. Frontend, documentação, testes de falha e gates finais.
