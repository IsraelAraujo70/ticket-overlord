# Catálogo externo e eventos locais

- **Status:** Aceita
- **Decidida em:** 2026-08-11 15:53:35 -03:00

## Contexto

O desafio exige que o organizador monte um evento a partir de um catálogo de shows ou filmes fornecido por Ticketmaster Discovery ou TMDb. Data, local, capacidade, preço, inventário, reservas e ingressos pertencem ao Ticket Overlord e precisam continuar estáveis mesmo quando o fornecedor externo estiver indisponível ou alterar seus dados.

O produto representa uma plataforma de eventos semelhante ao Ticketmaster. Consumir os próprios eventos do Ticketmaster como fonte principal confundiria o catálogo de origem com os eventos que o Ticket Overlord vende.

## Decisão

- Usar o TMDb como catálogo externo inicial.
- Buscar filmes exclusivamente pelo backend, mantendo o token fora do navegador.
- Criar um evento local a partir do filme selecionado e persistir `externalSource`, `externalId` e um snapshot dos campos necessários para apresentação.
- Tratar o PostgreSQL como fonte de verdade para data, local, capacidade, preço, status, organização, inventário e futuras relações com reservas e ingressos.
- Listar no catálogo público somente eventos locais com status `PUBLISHED`.
- Criar snapshots determinísticos no seed sem chamar o TMDb, mantendo IDs externos para demonstrar a procedência.

## Alternativas consideradas

### Usar eventos do Ticketmaster como catálogo e fonte de verdade

Rejeitada porque datas, locais, disponibilidade e venda desses eventos pertencem a outro produto e não representam o inventário controlado pelo Ticket Overlord.

### Não persistir eventos localmente

Rejeitada porque impediria garantir capacidade, concorrência, reservas, pagamento e emissão de ingressos com transações locais.

### Usar TMDb e Ticketmaster simultaneamente

Adiada. Uma segunda integração não melhora o fluxo obrigatório o suficiente para justificar outra normalização, credencial e conjunto de falhas nesta etapa.

## Consequências

- A criação de eventos exige `TMDB_READ_ACCESS_TOKEN`, mas eventos já criados e os dados do seed continuam funcionais sem uma chamada ao fornecedor.
- Mudanças no TMDb não alteram silenciosamente eventos locais existentes.
- Filmes podem originar várias sessões locais, pois não haverá unicidade apenas pelo ID externo.
- Um novo fornecedor poderá implementar a mesma porta quando houver necessidade aprovada.
