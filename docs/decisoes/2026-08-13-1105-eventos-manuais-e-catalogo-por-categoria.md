# Eventos manuais e catálogo por categoria

- **Status:** Aceita
- **Decidida em:** 2026-08-13 11:05:58 -03:00
- **Substitui parcialmente:** [Catálogo externo e eventos locais](./2026-08-11-1553-catalogo-externo-e-eventos-locais.md) e [Publicação explícita de eventos](./2026-08-11-2032-publicacao-explicita-de-eventos.md)

## Contexto

O fluxo inicial classificava todo evento como `Cinema`, mesmo quando o título, a capa e a proposta pertenciam a shows, teatro ou outras experiências. O catálogo público também descartava eventos publicados de outras categorias. O challenge exige que o produto demonstre criação baseada em pelo menos um catálogo externo, mas não exige que toda categoria dependa desse fornecedor.

## Decisão

- Manter o TMDb como origem obrigatória para eventos da categoria `Cinema`.
- Permitir cadastro manual de título e descrição para `Shows e festivais`, `Teatro`, `Gastronomia`, `Tecnologia` e categorias informadas por meio de `Outros`.
- Tornar `externalSource` e `externalId` opcionais na persistência. Eventos manuais não simulam procedência externa.
- Manter data, local, capacidade, preço, capa, publicação e inventário como dados locais em todas as categorias.
- Exibir todos os eventos publicados no catálogo, agrupados por categoria na ordem da agenda.
- Preservar a categoria dos eventos já armazenados, pois ela não pode ser inferida com segurança a partir do título.

## Alternativas consideradas

### Buscar também shows no Ticketmaster

Adiada. Exigiria uma segunda credencial, normalização e tratamento de falhas sem ser necessária para demonstrar a integração externa exigida, já atendida pelo TMDb.

### Manter toda origem externa obrigatória

Rejeitada porque perpetuaria categorias incorretas ou impediria cadastrar eventos legítimos não representados pelo TMDb.

### Usar um identificador externo fictício em eventos manuais

Rejeitada porque registraria uma procedência inexistente e tornaria o contrato ambíguo.

## Consequências

- O contrato de criação passa a exigir `category`; `externalId` é obrigatório pela regra de domínio somente em Cinema, enquanto `title` e `summary` são obrigatórios nos eventos manuais.
- Clientes da API precisam aceitar `externalSource` e `externalId` nulos nas respostas.
- A migration torna apenas os campos de procedência externa anuláveis, sem alterar eventos existentes.
- O fluxo obrigatório do challenge continua demonstrável por meio da criação de uma sessão de Cinema baseada no TMDb.
