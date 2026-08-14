# Eventos iniciados permanecem informativos

- **Status:** Aceita
- **Decidida em:** 2026-08-14 19:42:13 -03:00

## Contexto

O catálogo e a busca mantêm eventos publicados na descoberta mesmo depois do horário de início. O detalhe, porém, aceitava somente eventos futuros e respondia como inexistente para um card ainda visível. Remover imediatamente esses eventos da descoberta eliminaria a inconsistência, mas também apagaria páginas que ainda são úteis para consulta e compartilhamento.

## Decisão

Eventos publicados permanecem acessíveis por slug depois do início, em modo informativo e sem possibilidade de compra.

- O contrato de detalhe expõe `isPurchasable` como estado explícito.
- Eventos iniciados retornam detalhe com `isPurchasable: false` e disponibilidade igual a zero, sem consultar ou criar holds no Redis.
- A página pública substitui toda a seleção de quantidade e o formulário de reserva por uma mensagem de evento encerrado.
- A API continua validando a data dentro da sincronização transacional do inventário. Uma chamada direta para criar reserva de evento iniciado permanece bloqueada.
- Eventos não publicados continuam indisponíveis publicamente.

## Alternativas consideradas

### Remover eventos iniciados da descoberta

Rejeitada. Evitaria cards sem venda, mas tornaria links existentes inúteis e impediria usar a página como registro informativo do evento.

### Manter o detalhe e desabilitar apenas o botão no navegador

Rejeitada. Uma proteção somente visual permitiria tentar a reserva chamando a API diretamente e deixaria o estado de compra implícito.

### Permitir compra depois do início

Rejeitada. Não há regra de produto para venda tardia, e isso comprometeria a expectativa de inventário e acesso da portaria.

## Consequências

- Catálogo, busca e links compartilhados continuam levando a uma página válida.
- Clientes distinguem claramente consulta histórica de disponibilidade para compra.
- O contrato HTTP ganha o campo obrigatório `isPurchasable`.
- O bloqueio de compra é aplicado tanto na apresentação quanto na fronteira transacional da API.
- Uma política futura de arquivamento ou retenção poderá retirar eventos antigos da descoberta sem alterar esta regra de segurança.
