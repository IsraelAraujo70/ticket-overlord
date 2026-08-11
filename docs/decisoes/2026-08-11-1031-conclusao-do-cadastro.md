# Conclusão do cadastro em página dedicada

- **Status:** Aceita
- **Decidida em:** 2026-08-11 10:31:56 -03:00

## Contexto

O cadastro bem-sucedido permanecia no formulário e exibia apenas uma linha azul entre os campos e o botão. A mensagem tinha peso visual semelhante ao retorno de erro e não deixava claro que a conta já havia sido criada nem que a confirmação do e-mail era a próxima etapa obrigatória.

## Decisão

- Redirecionar o cliente para `/cadastro/sucesso` e o organizador para `/admin/cadastro/sucesso` após a API concluir o cadastro.
- Usar uma mesma composição visual nas duas superfícies, com mensagem inequívoca de sucesso, instrução para confirmar o e-mail e acesso ao login correto.
- Disponibilizar o reenvio de confirmação na página de sucesso sem revelar se uma conta existe.
- Não incluir o e-mail cadastrado na URL, evitando persistir esse dado em histórico e logs de navegação.

## Alternativas consideradas

### Manter retorno inline no formulário

Rejeitada porque preserva campos editáveis e o botão de cadastro depois de a conta existir, além de não distinguir suficientemente sucesso de erro.

### Abrir um diálogo modal

Rejeitada porque o estado desapareceria ao atualizar a página e seria menos adequado para navegação direta, acessibilidade e retomada do fluxo.

### Reutilizar a rota que consome o token de confirmação

Rejeitada porque `/confirmar-email` espera um token no fragmento. Acessá-la logo após o cadastro produziria um erro falso de token ausente.

## Consequências

- O formulário permanece responsável apenas por erros corrigíveis antes da criação da conta.
- O sucesso recebe uma rota estável e pode ser recarregado sem repetir o cadastro.
- Cliente e organizador compartilham o componente, mas retornam a entradas de login diferentes.
- O usuário precisa informar novamente o e-mail apenas se solicitar reenvio.
