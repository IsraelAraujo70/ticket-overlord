# Criação administrativa de eventos

- **Status:** Implementado
- **Aprovado em:** 2026-08-11 15:53:35 -03:00
- **Implementado em:** 2026-08-11 16:25:51 -03:00

## Resultado observável

Um organizador autenticado poderá buscar filmes no TMDb, selecionar um título, definir data, local, capacidade e preço, enviar uma imagem de capa e criar um evento local em rascunho. A listagem administrativa mostrará somente os eventos da organização autenticada.

O catálogo público deixará de consumir registros demonstrativos em memória e passará a listar eventos locais publicados no PostgreSQL. O seed criará eventos publicados suficientes para o avaliador navegar pelo site sem depender do TMDb durante a inicialização.

## Escopo aprovado

1. Criar o módulo `events` no NestJS com responsabilidades de `presentation`, `application`, `domain` e `infrastructure`.
2. Integrar o backend ao endpoint de busca de filmes do TMDb por uma porta de catálogo externo.
3. Persistir eventos locais vinculados à organização, com origem externa, snapshot do filme, data, local, capacidade, preço, status e chave da capa.
4. Criar uma porta de armazenamento de objetos com adapter S3 usando MinIO localmente e AWS S3 em produção.
5. Aceitar uma capa obrigatória em JPEG, PNG ou WebP, limitada a 5 MiB e validada pelo conteúdo do arquivo.
6. Criar os contratos autenticados para buscar o catálogo externo, listar eventos da organização e criar um rascunho.
7. Implementar `/admin/eventos` e `/admin/eventos/novo` no Next.js, preservando o shell, os componentes shadcn/Base UI e a hierarquia de componentes existente.
8. Substituir a fonte mock do catálogo público por eventos publicados retornados pela API.
9. Estender o seed com eventos locais publicados e capas no armazenamento de objetos.
10. Manter Swagger e testes E2E sincronizados com os novos contratos.

## Contratos planejados

- `GET /external-catalog/movies?query=`: busca filmes no TMDb para organizadores autenticados.
- `GET /events`: lista eventos locais da organização autenticada.
- `POST /events`: cria um evento local em rascunho com `multipart/form-data`.
- `GET /events/published`: lista eventos publicados para o catálogo público.

## Regras

- Somente `ORGANIZER` com `organizationId` cria e lista eventos da própria organização.
- O evento local guarda `externalSource=TMDB` e o identificador do filme, mas reservas e ingressos sempre referenciarão o ID local.
- Título, descrição e data de lançamento são copiados do TMDb nesta etapa; o organizador personaliza somente capa, data, local, capacidade e preço.
- Novos eventos são criados como `DRAFT` e não aparecem no catálogo público.
- URLs assinadas nunca são persistidas; somente a chave do objeto é armazenada.
- Uma falha de persistência após o upload tenta remover a capa para não deixar um objeto órfão.
- O seed usa snapshots determinísticos e não chama o TMDb.

## Dependências aprovadas

- `@aws-sdk/client-s3`: operações compatíveis com MinIO e AWS S3.
- `@aws-sdk/s3-request-presigner`: URLs temporárias de leitura para buckets privados.
- `file-type`: aprovada inicialmente para validar o formato real da imagem, mas removida durante a implementação conforme a nota abaixo.
- Tipagem do Multer se necessária para o contrato TypeScript do upload.

> **Nota de implementação:** `file-type` foi removida durante a validação porque sua distribuição ESM-only era incompatível com o runtime CommonJS atual da API. As três assinaturas binárias aceitas são validadas diretamente, mantendo a mesma regra sem uma dependência de runtime adicional.

## Fora do escopo

- Editar, publicar, cancelar ou excluir eventos pelo Admin.
- Upload direto do navegador por URL pré-assinada.
- Múltiplas imagens, transformação, recorte ou otimização de mídia.
- Provisionar ou alterar recursos de produção na AWS ou Railway.
- Reservas, pagamentos, ingressos e portaria.

## Validação

- Testes unitários dos casos de uso com adapters falsos.
- Testes E2E com PostgreSQL e MinIO reais para autenticação, isolamento por organização, criação e leitura da capa.
- Asserções focadas do OpenAPI para método, caminho, autenticação, multipart e schemas.
- Testes de componentes e ações do Next.js para busca, validação, criação, erro e listagem.
- Verificação do seed e do catálogo público com eventos publicados.
- `pnpm lint`, `pnpm test`, `pnpm build` e `docker compose config --quiet` sob Node.js 24.
- Verificação visual responsiva do Admin e do catálogo público.

## Resultado da validação

- `pnpm lint`, `pnpm test`, `pnpm build`, `docker compose config --quiet` e `git diff --check` passaram sob Node.js 24.
- A API passou em 15 suítes com 46 testes unitários; a web passou em 25 arquivos com 72 testes; os 8 testes E2E passaram contra PostgreSQL e MinIO reais.
- O seed foi executado duas vezes e permaneceu com exatamente quatro eventos publicados.
- O catálogo público foi verificado no navegador com as cinco imagens carregadas. Essa verificação encontrou e corrigiu a incompatibilidade entre o otimizador do Next.js e o redirecionamento para URLs assinadas.
- A automação do Chrome foi bloqueada por uma interface de extensão durante o login do organizador, portanto as telas administrativas ficaram validadas por lint, testes de componentes, build e contratos E2E, sem uma captura visual autenticada final.
