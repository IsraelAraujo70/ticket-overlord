# Ingressos, QR Code, compartilhamento e portaria

- **Status:** Implementado
- **Criado em:** 2026-08-12 09:55:48 -03:00
- **Aprovado em:** 2026-08-12 09:54:58 -03:00

## Resultado observável

Uma compra aprovada de três unidades gera exatamente três ingressos. O cliente acessa **Meus Ingressos**, abre cada ingresso, exibe QR Code e copia um link secreto que pode ser visualizado sem login.

Na portaria, organizador ou staff seleciona um evento da própria organização e lê o QR pela câmera ou informa o código manual. A API responde claramente `VALID`, `INVALID`, `ALREADY_USED`, `WRONG_EVENT` ou `OUTSIDE_ADMISSION_WINDOW`. Duas validações simultâneas do mesmo ingresso produzem um único `VALID`.

## Escopo

1. Criar schema de chaves de assinatura e ingressos individuais.
2. Gerar a chave Ed25519 inicial no PostgreSQL sob advisory lock.
3. Emitir ingressos na transação de aprovação com unicidade por reserva e sequência.
4. Listar e detalhar ingressos do cliente autenticado.
5. Expor visualização por link secreto fixo, armazenado apenas como hash.
6. Assinar payload canônico e verificar sua assinatura antes da validação.
7. Listar eventos disponíveis para a portaria da organização autenticada.
8. Validar QR ou código manual somente no dia do evento em `America/Sao_Paulo`.
9. Consumir uma única vez por update condicional atômico.
10. Implementar Meus Ingressos, detalhe, compartilhamento e portaria responsiva com câmera e fallback manual.
11. Atualizar Swagger, seed, README e testes E2E.

## Modelo durável

- `ticket_signing_keys`: `id`, `algorithm=Ed25519`, chaves PEM, status e timestamps.
- `tickets`: reserva, evento, cliente, sequência, código manual, hash do código, hash do compartilhamento, versão/chave do QR, estado, uso e responsável pela validação.
- Constraint única `(reservation_id, sequence)` impede emissão duplicada.
- Código manual e token de compartilhamento são aleatórios, não derivados de IDs sequenciais.
- Chaves privadas não serão expostas em respostas, logs, Swagger ou seed.

## Payload QR

Formato canônico versionado:

```text
to1.<keyId>.<ticketId>.<eventId>.<signatureBase64Url>
```

A assinatura cobre exatamente `to1.<keyId>.<ticketId>.<eventId>`. O QR não carrega nome, e-mail, preço ou outro dado pessoal.

## Contratos HTTP

- `GET /tickets`: ingressos do cliente autenticado.
- `GET /tickets/:ticketId`: detalhe do próprio ingresso.
- `GET /shared-tickets/:token`: visualização pública por segredo.
- `GET /gate/events`: eventos da organização para organizador ou staff.
- `POST /gate/events/:eventId/validate`: recebe `code` lido do QR ou digitado manualmente.

Todos os contratos terão DTOs Swagger e asserções E2E sincronizadas.

## Regras de validação

1. Resolver código manual por hash ou interpretar e verificar o QR Ed25519.
2. Não revelar existência de ingresso para códigos inválidos.
3. Confirmar vínculo entre payload, ingresso persistido e evento persistido.
4. Confirmar que o evento pertence à organização do operador.
5. Comparar a data local atual e a data local do evento em `America/Sao_Paulo`.
6. Retornar `WRONG_EVENT` sem consumir quando o ingresso pertence a outro evento da mesma organização.
7. Executar update `VALID -> USED`; zero linhas significa `ALREADY_USED` ou mudança concorrente.
8. Registrar `usedAt` e `usedByUserId` no primeiro sucesso.

## Dependências aprovadas

- `qrcode` e `@types/qrcode` para renderizar o QR no frontend.
- `@zxing/browser` para câmera cross-browser.

Assinatura e verificação usam `node:crypto`, sem dependência adicional no backend.

## Validação

- Unitários de serialização, assinatura, adulteração e janela em São Paulo.
- E2E com PostgreSQL real para emissão por quantidade e replay do pagamento.
- E2E de isolamento entre clientes e acesso por compartilhamento.
- E2E para QR adulterado, código inválido, evento errado, janela inválida e staff de outra organização.
- E2E concorrente provando uma única admissão válida.
- Testes web de lista, detalhe, cópia de link, câmera indisponível e fallback manual.
- Lint, testes, builds, migrations desde banco vazio, `docker compose config --quiet` e `git diff --check`.
- Validação visual mobile e desktop das páginas novas.

## Fora do escopo

- Transferência de propriedade.
- Revogação ou regeneração do link de compartilhamento.
- Apple Wallet, Google Wallet ou PDF.
- E-mail de ingresso.
- Operação offline da portaria.
- Assentos marcados.
- KMS, HSM ou secret manager nesta entrega.
