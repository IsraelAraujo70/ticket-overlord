# Ingressos assinados e validação atômica na portaria

- **Status:** Aceita
- **Decidida em:** 2026-08-12 09:55:48 -03:00

## Contexto

O pagamento aprovado já persiste uma compra durável, mas o produto ainda não emite ingressos individuais, não oferece QR Code e não valida entrada na portaria. O challenge exige um ingresso por unidade utilizável, código não forjável, compartilhamento, câmera com fallback manual e garantia de uso único.

## Decisão

- Emitir um ingresso por unidade comprada na mesma transação PostgreSQL que confirma reserva e pagamento.
- Usar Ed25519 do `node:crypto` para assinar um payload canônico e versionado contendo identificador do ingresso, evento, versão da chave e versão do formato.
- Gerar e armazenar no PostgreSQL um par de chaves Ed25519 versionado. A criação da primeira chave será protegida por advisory lock e novas emissões usarão somente a chave ativa.
- Manter o estado operacional do ingresso no PostgreSQL. Uma assinatura válida prova origem e integridade, mas não substitui a consulta de status, evento e janela de admissão.
- Criar um código manual aleatório e um token secreto fixo de compartilhamento por ingresso, armazenando somente seus hashes.
- Permitir que o link secreto visualize o ingresso e o QR sem transferir propriedade.
- Permitir que organizadores e staff validem apenas ingressos de eventos da própria organização.
- Permitir admissão somente na data local do evento em `America/Sao_Paulo`.
- Consumir o ingresso com um `UPDATE` condicional dentro de transação, garantindo que validações concorrentes produzam exatamente um sucesso.
- Usar `qrcode` para renderização e `@zxing/browser` para leitura por câmera, mantendo entrada manual obrigatória como fallback.

## Alternativas consideradas

### Token opaco aleatório no QR

Rejeitado por preferência de produto por um código assinado. Continuaria seguro com hash no banco, mas não demonstraria verificação criptográfica de origem.

### HMAC

Rejeitado porque usa a mesma chave para assinar e verificar. Ed25519 separa chave privada e pública e deixa a intenção do mecanismo mais clara.

### Chave privada em secret manager

Seria a opção recomendada para produção, mas foi preterida nesta entrega para simplificar setup e avaliação. A chave versionada no banco permite rotação futura, mas uma cópia completa do banco também permite assinar ingressos fraudulentos.

### BarcodeDetector nativo

Rejeitado como única estratégia porque não possui suporte suficiente em Safari/iPhone. A biblioteca de câmera será acompanhada de fallback manual.

### Validação em qualquer horário

Rejeitada. A portaria aceitará ingressos somente no dia local do evento.

## Consequências

- Pagamento aprovado e ingressos são atomicamente duráveis; retries não duplicam emissão.
- Cada ingresso pode ser compartilhado e validado separadamente.
- O QR não pode ser alterado sem invalidar a assinatura, mas ainda requer consulta ao PostgreSQL para uso único e autorização do evento.
- A chave privada no PostgreSQL é uma limitação de segurança conhecida e deve migrar para secret manager ou KMS antes de uso real.
- Rotação mantém chaves públicas antigas para verificar ingressos já emitidos.
- A câmera exige HTTPS fora de localhost e permissão explícita do navegador.
