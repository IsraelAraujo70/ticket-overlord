# Wizard e pré-processamento da capa do evento

- **Status:** Aceita
- **Decidida em:** 2026-08-11 19:40:35 -03:00

## Contexto

A criação de evento concentrava catálogo, dados operacionais e capa em uma página longa. Os pôsteres do TMDb ocupavam altura excessiva, o formulário não preservava o progresso após uma recarga e imagens acima de 1 MB eram recusadas pelo limite padrão das Server Actions do Next.js antes de alcançarem a API.

## Decisão

- Dividir a criação do evento em quatro etapas sequenciais: filme, sessão, capa e revisão.
- Exibir uma etapa por vez, com avanço condicionado à validação dos dados exigidos e retorno para etapas anteriores.
- Persistir no `localStorage` a etapa restaurável, a busca, o filme selecionado e os campos textuais da sessão.
- Não persistir o arquivo da capa. Uma recarga nas etapas de capa ou revisão retorna à etapa de capa e exige nova seleção do arquivo.
- Compactar a capa no navegador com `browser-image-compression`, convertendo-a para WebP, limitando a maior dimensão a 1920 pixels e buscando um arquivo de até 0,75 MiB.
- Configurar o limite das Server Actions em 2 MB como margem para o envelope da requisição, mantendo a validação da API em 5 MiB.
- Manter os resultados do TMDb em cartões compactos dentro de uma área com altura limitada e rolagem.

## Alternativas consideradas

### Formulário longo em uma única página

Rejeitado porque não comunica a sequência da tarefa, amplia o deslocamento vertical e faz o catálogo competir visualmente com os campos da sessão.

### Persistir a imagem no IndexedDB

Adiado. Permitiria restaurar exatamente a etapa de revisão, mas adicionaria uma segunda estratégia de persistência e tratamento de blobs para um rascunho local de curta duração.

### Aumentar apenas o limite da Server Action

Rejeitado como solução isolada porque enviaria arquivos maiores sem necessidade e não melhoraria o tempo de upload. A margem de 2 MB existe apenas para transportar com segurança a imagem já compactada.

### Implementar a compressão diretamente com Canvas

Rejeitado porque exigiria manter manualmente redimensionamento, orientação, qualidade iterativa e diferenças entre navegadores para uma capacidade já coberta por uma biblioteca pequena e especializada.

## Consequências

- O organizador retoma o preenchimento no mesmo navegador, mas precisa escolher a capa novamente depois de recarregar a página.
- O arquivo que chega à aplicação é WebP e normalmente menor que 0,75 MiB, embora a API continue responsável pela validação definitiva do tipo e do tamanho.
- A compactação acontece antes do envio e precisa apresentar estado de processamento e falha recuperável na interface.
- O rascunho local é removido somente depois que a criação do evento retorna sucesso.
