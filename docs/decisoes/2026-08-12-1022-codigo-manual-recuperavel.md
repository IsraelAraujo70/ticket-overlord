# Código manual recuperável

- **Status:** Aceita
- **Decidida em:** 2026-08-12 10:22:26 -03:00
- **Substitui parcialmente:** [Ingressos assinados e validação atômica na portaria](./2026-08-12-0955-ingressos-assinados-e-validacao-atomica.md), somente quanto ao armazenamento do código manual

## Contexto

O código manual é o fallback obrigatório quando a câmera não está disponível e deve permanecer visível em **Meus Ingressos** depois da emissão. Armazenar somente seu hash impediria recuperar esse valor após o pagamento.

## Decisão

- Armazenar o código manual aleatório e seu hash no PostgreSQL.
- Retornar o código somente ao proprietário, ao portador do link secreto e nas superfícies operacionais necessárias.
- Resolver validações manuais pelo hash SHA-256 normalizado.
- Não incluir código manual em logs ou mensagens de erro.

## Alternativas consideradas

### Armazenar somente o hash

Rejeitada porque o cliente não conseguiria consultar novamente o fallback manual.

### Derivar o código da chave privada

Rejeitada porque acoplaria mais um segredo operacional à chave de assinatura e dificultaria rotação e revogação futuras.

### Criptografar com uma chave externa

Seria preferível em produção, mas adicionaria gestão de chaves fora do escopo desta entrega.

## Consequências

- O fallback manual continua disponível durante toda a vida do ingresso.
- Uma leitura indevida do banco expõe códigos utilizáveis; o banco e seus backups devem ser tratados como material sensível.
- Uma evolução futura deve cifrar os códigos recuperáveis ou entregá-los por uma carteira externa segura.
