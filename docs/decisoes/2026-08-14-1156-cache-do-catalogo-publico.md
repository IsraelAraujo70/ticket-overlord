# Cache do catálogo público

- **Status:** Aceita
- **Decidida em:** 2026-08-14 11:56:12 -03:00

## Contexto

A página inicial consulta repetidamente as mesmas páginas de eventos publicados. Ao mesmo tempo, o cabeçalho pode conter dados da sessão autenticada e a busca recebe termos variados, portanto armazenar a resposta HTML inteira ou compartilhar indiscriminadamente todas as consultas criaria risco de vazamento e baixa eficiência do cache.

Consultas de um caractere também não produzem resultados úteis no Full Text Search em português e geram chamadas desnecessárias até o PostgreSQL.

## Decisão

As páginas sem filtro do catálogo público serão armazenadas no Data Cache do Next.js por 60 segundos. A chave inclui a URL da página consultada, e a publicação de um evento invalida imediatamente todas as entradas pela tag `published-events`.

Sessão, páginas personalizadas, operações administrativas e buscas filtradas permanecem com `no-store`. A interface e o contrato HTTP exigem no mínimo dois caracteres para uma busca não vazia, e a interface não chama o BFF quando o termo é inválido.

A criação de um rascunho não invalida o catálogo porque ainda não altera eventos públicos.

## Alternativas consideradas

### Cachear a página inicial inteira

Rejeitada porque a mesma árvore renderiza informações da sessão atual e não deve ser compartilhada entre usuários.

### Cache no CDN por `Cache-Control`

Adiada porque o comportamento de cache de rotas de API depende da configuração do proxy e da elegibilidade da rota. O Data Cache oferece uma política explícita dentro da aplicação.

### Cachear também resultados de busca

Adiada porque os termos têm alta cardinalidade. Primeiro será medido o comportamento da busca antes de escolher uma política específica.

### Manter todas as consultas com `no-store`

Rejeitada porque repete a mesma leitura pública do PostgreSQL mesmo durante a janela curta em que o catálogo não mudou.

## Consequências

- A home reduz leituras repetidas sem compartilhar dados autenticados.
- Uma publicação aparece no catálogo na próxima leitura após a invalidação.
- Falhas de invalidação ainda convergem em até 60 segundos.
- Resultados de busca continuam refletindo o PostgreSQL sem cache compartilhado.
- Termos de um caractere recebem orientação local e `400 Bad Request` quando enviados diretamente à API.
- Uma futura reorganização interna da busca permanece uma decisão separada e não foi aprovada por este registro.
