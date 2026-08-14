# Search híbrida com PostgreSQL e pgvector

- **Status:** Aceita
- **Decidida em:** 2026-08-14 16:00:16 -03:00

## Contexto

A busca pública calculava um `tsvector` para cada linha consultada, não aplicava ranking e não oferecia autocomplete. Com 9.000 eventos, isso impedia usar um índice GIN e consultas curtas retornavam uma experiência fraca. O produto também precisa demonstrar recuperação semântica, mas o desafio não justifica operar Elasticsearch ou Milvus antes de validar essa necessidade.

Esta decisão detalha a etapa PostgreSQL prevista em [Evolução da busca](./2026-08-10-1300-evolucao-da-busca.md) e preserva a política de cache definida em [Cache do catálogo público](./2026-08-14-1156-cache-do-catalogo-publico.md).

## Decisão

O módulo interno `SearchModule` será responsável pelos contratos de busca pública.

- O PostgreSQL mantém um `tsvector` ponderado e armazenado: título com peso A, categoria, cidade e local com peso B e descrição com peso C. Um índice GIN atende o Full Text Search em português.
- Colunas normalizadas com índices `pg_trgm` atendem autocomplete por prefixo e aproximação para evento, categoria, cidade e local.
- O pgvector armazena vetores de 1.536 dimensões por evento. O adaptador de embeddings usa `openai/text-embedding-3-small` através do endpoint HTTP do OpenRouter, sem SDK adicional.
- Um comando explícito e idempotente calcula o hash do documento, envia somente documentos novos ou alterados e atualiza os vetores em lotes.
- A busca híbrida recupera candidatos lexicais e semânticos e combina suas posições com Reciprocal Rank Fusion. Correspondência exata, prefixo e data futura preservam desempates determinísticos.
- Se o OpenRouter estiver ausente, lento ou indisponível, a requisição usa apenas o FTS. Autocomplete e busca lexical não dependem de IA.
- A home sem filtro continua usando `/events/published` e cache curto. Consultas usam `/search` sem cache compartilhado.

## Alternativas consideradas

### Elasticsearch

Adiado. Oferece recursos maduros de busca híbrida e análise, mas adiciona outro serviço, sincronização de dados e custo operacional sem necessidade demonstrada para 9.000 eventos.

### Milvus

Adiado. É adequado quando a recuperação vetorial exige escala ou especialização que o pgvector não atende. Neste desafio, manter filtros, FTS e vetores próximos da fonte de verdade simplifica consistência e operação.

### LLM em cada tecla do autocomplete

Rejeitada por latência, custo e comportamento não determinístico. O autocomplete usa índices locais; embeddings são calculados fora do caminho de digitação.

### Apenas Full Text Search

Rejeitada como entrega final porque não recupera intenção quando os termos da consulta não aparecem no evento. Permanece obrigatoriamente como fallback.

## Consequências

- A instalação PostgreSQL precisa disponibilizar as extensões `pg_trgm` e `vector` antes da migration.
- Produção precisa migrar para um serviço PostgreSQL com pgvector antes de publicar esta branch.
- A dimensão do vetor é parte do schema; trocar modelo ou dimensão exige nova decisão e migration.
- Eventos sem vetor continuam pesquisáveis pelo FTS e entram na busca semântica após o backfill.
- O conjunto híbrido é limitado a candidatos ranqueados, adequado ao volume do desafio; telemetria futura deve orientar qualquer migração para um motor externo.
- O backfill de produção é uma escrita de dados separada e requer confirmação e acompanhamento próprios.
