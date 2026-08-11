# Imagens de eventos em armazenamento S3

- **Status:** Aceita
- **Decidida em:** 2026-08-11 15:53:35 -03:00

## Contexto

O organizador precisa enviar uma capa própria para o evento. O desenvolvimento local deve ser reproduzível sem uma conta em nuvem, enquanto a produção usará um bucket AWS S3. Persistir binários no PostgreSQL ou no filesystem efêmero da aplicação dificultaria o deploy e misturaria responsabilidades.

## Decisão

- Criar uma porta de armazenamento de objetos orientada às capacidades exigidas por eventos.
- Implementar um adapter com o AWS SDK para JavaScript v3, usando a API compatível com S3 do MinIO localmente e AWS S3 em produção.
- Manter o bucket privado e persistir somente a chave do objeto.
- Gerar URLs temporárias de leitura quando a API apresentar um evento.
- Fazer o upload inicial através da API, limitado a 5 MiB e aos formatos JPEG, PNG e WebP validados pelo conteúdo.
- Gerar chaves pelo backend sob o prefixo da organização e do evento, sem confiar no nome original.
- Tentar excluir a capa quando o upload for concluído, mas a persistência do evento falhar.

## Alternativas consideradas

### Upload direto por URL pré-assinada

Adiado. Reduz tráfego pela API, mas exige CORS do bucket, estado de upload pendente, confirmação e limpeza de objetos abandonados. O benefício não é necessário para uma única imagem pequena por evento.

### Bucket público

Rejeitado. URLs temporárias permitem leitura sem abrir listagem ou escrita pública e preservam uma política mais restrita para o ambiente de produção.

### Imagem no PostgreSQL ou filesystem da aplicação

Rejeitada porque aumenta o banco com binários ou depende de disco que não é um contrato durável do deploy.

## Consequências

- A API recebe o arquivo inteiro nesta primeira versão, comportamento aceitável com o limite de 5 MiB.
- MinIO passa a fazer parte da infraestrutura local e dos testes de integração.
- Produção precisará fornecer bucket, região, credenciais e política IAM restrita antes do deploy, mas nenhuma infraestrutura de produção será criada nesta implementação.
- Leitura de capas depende da validade da URL assinada e precisa ser renovada em novas respostas da API.
