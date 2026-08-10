# Sessões, senhas e tokens de autenticação

- **Status:** Aceita
- **Decidida em:** 2026-08-10 19:11:16 -03:00

## Contexto

A autenticação precisa funcionar para o site público e para o painel administrativo, permitir revogação no logout e após redefinição de senha e não expor credenciais persistentes ao JavaScript do navegador. O projeto usa Node.js e PostgreSQL e ainda não possui uma decisão de sessão.

## Decisão

- Usar sessões opacas aleatórias, não JWT.
- Gerar tokens com 32 bytes do CSPRNG do Node.js e persistir somente seu SHA-256.
- Manter a sessão por sete dias e revogá-la no logout.
- Entregar a sessão ao frontend por cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção, sem `localStorage`.
- Derivar senhas com `crypto.scrypt` do Node.js, salt aleatório e comparação em tempo constante.
- Aceitar senhas entre 12 e 128 caracteres sem regras artificiais de composição.
- Exigir confirmação de e-mail antes do primeiro login.
- Manter tokens de confirmação por 24 horas e de recuperação por uma hora, ambos de uso único e armazenados somente como hash.
- Após redefinir a senha, revogar todas as sessões do usuário.
- Não revelar a existência de uma conta nas operações de reenvio ou recuperação.
- Colocar o token no fragmento dos links do frontend para que ele não seja enviado automaticamente em requisições e logs HTTP.

## Alternativas consideradas

### JWT persistido no navegador

Rejeitado porque revogação e rotação continuariam exigindo estado no servidor, enquanto `localStorage` ampliaria a exposição a scripts executados na página.

### Biblioteca externa de hashing

Adiada. O `scrypt` nativo atende ao requisito sem adicionar uma dependência binária ao projeto.

### Login antes da confirmação

Rejeitado por decisão de produto. Cliente e organizador devem provar o controle do e-mail antes de receber uma sessão.

## Consequências

- Cada requisição autenticada exige uma consulta de sessão no PostgreSQL.
- A limpeza de sessões e tokens expirados poderá ser adicionada depois sem alterar o contrato.
- Alterar senha encerra sessões existentes, inclusive em outros dispositivos.
- Páginas de confirmação e recuperação precisam ler o fragmento no navegador e consumir o token uma única vez.
