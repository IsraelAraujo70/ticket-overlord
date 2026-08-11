# Publicação explícita de eventos

- **Status:** Aceita
- **Decidida em:** 2026-08-11 20:32:54 -03:00

## Contexto

Eventos criados pelo organizador já são persistidos como rascunho, enquanto o catálogo público consulta apenas eventos locais com status `PUBLISHED`. Faltava uma operação que permitisse ao proprietário concluir essa transição sem expor automaticamente um evento ainda em preparação.

Nesta etapa, o produto apresentará somente sessões de cinema. As demais categorias não devem gerar seções públicas antes de terem um fluxo próprio aprovado.

## Decisão

- Manter todo evento novo com status inicial `DRAFT`.
- Expor `POST /events/:eventId/publish` para o organizador proprietário publicar uma sessão futura.
- Fazer a transição de `DRAFT` para `PUBLISHED` com uma atualização atômica limitada pelo evento, organização, status atual e data da sessão.
- Tratar a repetição da publicação de um evento já publicado como uma operação idempotente.
- Manter rascunhos, eventos de outra organização e sessões já iniciadas fora da publicação válida.
- Exibir no catálogo público apenas eventos publicados cuja categoria seja `Cinema`, reunidos em uma única seção.
- Manter somente um evento publicado no seed, suficiente para o fluxo inicial exigido pelo challenge.

## Alternativas consideradas

### Publicar automaticamente durante a criação

Rejeitada porque eliminaria a separação aprovada entre rascunho e publicação e poderia expor dados antes da revisão do organizador.

### Permitir alteração direta e genérica do status

Rejeitada porque ampliaria o contrato sem necessidade e tornaria menos explícitas as regras de propriedade, data e transição.

### Manter várias categorias no catálogo

Adiada. O fluxo atual cria apenas sessões de cinema e não há gestão específica para shows ou outras categorias.

## Consequências

- O organizador passa a controlar quando um rascunho entra no catálogo público.
- A publicação repetida não cria efeitos adicionais nem falha para o mesmo evento.
- Eventos já iniciados exigirão outro fluxo futuro para correção ou gestão, pois não podem ser publicados.
- Novas categorias exigirão uma decisão posterior para entrar na navegação pública.
- O seed continua atendendo à avaliação imediata sem dominar a landing page com fixtures.
