# Campos validados no cadastro de organizadores

## Resultado observável

O cadastro de organizadores passará a oferecer campos guiados para CNPJ, telefone e UF:

- CNPJ com máscara própria, aceitando o formato numérico tradicional e o formato alfanumérico adotado em 2026.
- Telefone brasileiro com formatação durante a digitação, aceitando formato nacional ou prefixo `+55`.
- UF selecionada exclusivamente entre as 27 unidades federativas brasileiras.
- Erros de CNPJ e telefone exibidos abaixo do respectivo campo ao sair dele e novamente ao enviar o formulário.
- Um telefone válido como `+55 35 99742-1900` será aceito e persistido como `+5535997421900`.

## Dependências aprovadas pelo plano

### Web

- `zod@4.4.3` para parsing, mensagens e normalização dos campos antes da Server Action.
- `react-phone-number-input@3.4.17` para digitação e formatação de telefones brasileiros.
- `@react-input/mask@2.0.4` para o componente mascarado de CNPJ.
- `@fnando/cnpj@2.0.0` para normalizar e validar CNPJ numérico ou alfanumérico.

### API

- `libphonenumber-js@1.13.10` como dependência direta para validar e normalizar telefones sem confiar no cliente.
- `@fnando/cnpj@2.0.0` para manter o backend compatível com os dois formatos de CNPJ.

O `Select` de UF será adicionado pelo registry oficial do shadcn. Ele usa o Base UI já instalado e não adiciona outra biblioteca de interface.

## Componentes e validação no frontend

1. Criar um `PhoneInput` reutilizável sobre `react-phone-number-input/input`, integrado ao `Input` visual existente.
2. Configurar `BR` como país padrão. O usuário poderá digitar telefone nacional ou colar um número com `+55`; o valor controlado será E.164.
3. Criar um `CnpjInput` reutilizável sobre `@react-input/mask`, convertendo letras para maiúsculas e apresentando a máscara visual de CNPJ, em que as doze primeiras posições aceitam letra ou número e as duas últimas aceitam somente números.
4. Criar um schema Zod compartilhado pelo componente e pela Server Action para CNPJ, telefone e UF.
5. Validar CNPJ e telefone no `blur` e no envio. Usar `data-invalid`, `aria-invalid` e `FieldError` para associar a mensagem ao campo.
6. A Server Action validará novamente e nunca enviará dados inválidos à API. Ela enviará o CNPJ normalizado com 14 caracteres e o telefone em E.164.
7. Manter um feedback global apenas para falhas gerais, duplicidade ou indisponibilidade da API.

## Unidades federativas

1. Manter uma lista tipada e ordenada alfabeticamente com as 27 unidades federativas, incluindo o Distrito Federal.
2. Substituir o `Input` livre de UF pelo `Select` oficial do shadcn, exibindo sigla e nome completo.
3. O `Select` será controlado pelo mesmo estado preenchido pelo ViaCEP, portanto uma resposta com `MG` selecionará automaticamente “MG - Minas Gerais”.
4. A API deixará de aceitar qualquer par de letras e validará a sigla contra a lista oficial.

## Contrato e persistência

- O endpoint continuará sendo `POST /auth/register`, sem alteração de método, rota ou status codes.
- O telefone aceitará entrada nacional ou `+55`, mas a aplicação persistirá somente E.164 brasileiro.
- O CNPJ será persistido sem pontuação e em maiúsculas.
- O banco continuará usando as colunas existentes `phone varchar(20)`, `cnpj varchar(14)` e `state varchar(2)`; não haverá migration.
- Não haverá verificação de posse ou existência do telefone por SMS, WhatsApp ou OTP. A validação comprova apenas formato e plausibilidade segundo os metadados do `libphonenumber`.
- Registros antigos não serão alterados automaticamente. O seed será atualizado para usar o novo formato canônico do telefone.

## Backend

1. Substituir a validação de telefone por parsing com `libphonenumber-js`, exigir país `BR`, validar o número e normalizar para E.164.
2. Substituir o algoritmo numérico local de CNPJ pela biblioteca compatível com CNPJ alfanumérico, preservando testes de regressão do formato tradicional.
3. Validar UF por pertencimento à lista das 27 siglas.
4. Atualizar exemplos e descrições do Swagger para documentar os formatos aceitos e o formato canônico.
5. Manter as mensagens `INVALID_CNPJ`, `INVALID_PHONE` e `INVALID_STATE` e os demais contratos de erro existentes.

## Testes e validação

- Testes do schema Zod para telefone nacional, telefone com `+55`, telefone inválido, CNPJ numérico, CNPJ alfanumérico e CNPJ inválido.
- Testes dos componentes de telefone e CNPJ, incluindo formatação, acessibilidade e erros inline.
- Teste do formulário confirmando que o ViaCEP seleciona a UF correta e que as 27 opções estão disponíveis.
- Teste da Server Action garantindo que telefone e CNPJ chegam normalizados à API.
- Testes unitários do backend para normalização E.164, rejeição de número não brasileiro e validação dos dois formatos de CNPJ.
- Teste E2E PostgreSQL do cadastro de organizador com os novos formatos.
- Verificação visual em desktop e mobile.
- `pnpm lint`, `pnpm test`, `pnpm build`, `docker compose config --quiet` e `git diff --check`.

## Fora do escopo

- Confirmação do telefone por SMS, WhatsApp ou ligação.
- Telefones de organizações fora do Brasil.
- Consulta do CNPJ na Receita Federal ou validação da situação cadastral da empresa.
- Backfill de registros locais existentes.
- Migration, deploy ou alteração em produção.
