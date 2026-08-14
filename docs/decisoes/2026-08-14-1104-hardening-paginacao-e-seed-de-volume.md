# Hardening, paginação e seed de volume

- **Status:** Aceita
- **Data da decisão:** 2026-08-14T11:04:16-03:00

## Contexto

O ambiente de demonstração passou a ser público e precisava suportar uma carga representativa sem expor todos os registros em uma única resposta. A auditoria de segurança também identificou operações públicas de autenticação com scrypt sem limitação distribuída, configuração de produção permissiva e um seed capaz de restaurar contas privilegiadas com uma senha fallback.

## Decisão

- Paginar as listagens pública e administrativa no PostgreSQL, preservando o Full Text Search decidido anteriormente, sem distinção de acentos e com limite máximo de 100 itens por requisição.
- Usar o Redis existente para fixed-window rate limiting atômico em autenticação, recuperação de senha e criação de eventos.
- Fazer a configuração inferir produção de `NODE_ENV=production` e proibir o adapter de e-mail em console nesse ambiente.
- Exigir `ALLOW_PRODUCTION_DEMO_SEED=true` e `DEMO_PASSWORD` para qualquer seed em produção.
- Gerar um conjunto idempotente configurável, com padrão de 9.000 eventos publicados em 30 organizações e capas compartilhadas no storage.
- Manter as credenciais fallback apenas no ambiente local de avaliação.

## Alternativas consideradas

### Carregar todos os eventos e paginar somente no navegador

Rejeitada porque transfere volume desnecessário, aumenta latência e memória e torna 9.000 registros impraticáveis em dispositivos móveis.

### Adicionar uma biblioteca de throttling

Rejeitada porque o cliente Redis já está instalado e um contador atômico pequeno atende ao escopo sem nova dependência.

### Criar uma capa por evento

Rejeitada porque duplicaria milhares de objetos idênticos. O conjunto de demonstração usa quatro objetos compartilhados e mantém a capa original nos eventos criados pelo produto.

### Executar seed automaticamente no deploy

Rejeitada porque seed é uma mutação de dados explícita, deve ser observável e exige autorização separada em produção.

## Consequências

- Os contratos `GET /events` e `GET /events/published` passam a retornar `{ items, total, page, pageSize }`.
- O frontend precisa navegar páginas e encaminhar a busca ao backend.
- Redis se torna uma dependência de segurança e falha fechada nas rotas limitadas.
- O seed pode ser repetido sem multiplicar o conjunto de 9.000 eventos.
- Avaliadores locais continuam com credenciais conhecidas; produção deve fornecer a senha fora do repositório.
