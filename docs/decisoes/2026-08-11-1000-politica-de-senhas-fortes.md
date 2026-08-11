# Política de senhas fortes

- **Status:** Aceita
- **Decidida em:** 2026-08-11 10:00:34 -03:00
- **Substitui parcialmente:** [Sessões, senhas e tokens de autenticação](./2026-08-10-1911-sessoes-senhas-e-tokens.md), somente na política de composição de senhas.

## Contexto

A primeira versão aceitava qualquer senha entre 12 e 128 caracteres. Durante a validação do cadastro, foi aprovado que o produto deve orientar a força da senha em tempo real e recusar senhas que não combinem diferentes classes de caracteres. A regra precisa ser igual no cadastro de clientes, no cadastro de organizadores e na redefinição de senha, com a API como autoridade final.

## Decisão

- Exigir senhas entre 12 e 128 caracteres.
- Exigir ao menos uma letra maiúscula, uma letra minúscula, um número e um símbolo que não seja espaço em branco.
- Aplicar a política nos contratos de cadastro e redefinição de senha da API.
- Exibir no frontend um medidor com os níveis `Fraca`, `Média` e `Forte`, os quatro requisitos e um controle para mostrar ou ocultar a senha.
- Manter login e verificação de hashes existentes sem regra de composição, pois a política se aplica somente quando uma senha é criada ou redefinida.

## Alternativas consideradas

### Manter somente o comprimento mínimo

Substituída pela decisão aprovada de exigir composição e apresentar retorno visual antes do envio.

### Usar a força apenas como orientação visual

Rejeitada porque permitiria que clientes sem JavaScript ou chamadas diretas à API contornassem a regra aprovada.

### Adicionar uma biblioteca de estimativa de entropia

Rejeitada nesta etapa. Os quatro critérios são determinísticos, atendem ao comportamento aprovado e não exigem uma dependência nova.

## Consequências

- Cadastros e redefinições com senha fora da política recebem `400 Bad Request`.
- O Swagger publica comprimento e padrão de composição para os dois contratos.
- Contas e hashes já existentes permanecem válidos até que o usuário escolha uma nova senha.
- O frontend replica os critérios para retorno imediato, mas a API continua sendo a garantia de segurança.
- Senhas longas sem variedade de caracteres deixam de ser aceitas, reduzindo a flexibilidade de frases-senha em favor da regra de composição aprovada.
