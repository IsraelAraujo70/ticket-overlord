# Cadastro de organizador e preenchimento pelo ViaCEP

- **Status:** Aceita
- **Decidida em:** 2026-08-10 19:11:16 -03:00

## Contexto

O organizador representa uma empresa que publica eventos. Seu cadastro precisa de informações adicionais às do comprador e deve reduzir o trabalho de preencher endereço sem depender de uma consulta externa de situação cadastral do CNPJ.

## Decisão

- Solicitar nome do responsável, nome da organização, CNPJ, telefone, CEP, logradouro, número, complemento opcional, bairro, cidade e UF.
- Normalizar CNPJ para dígitos, validar formato e dígitos verificadores localmente e aplicar unicidade no PostgreSQL.
- Não consultar Receita Federal nem outro serviço de situação cadastral nesta etapa.
- Expor `GET /addresses/cep/:cep` na API e fazer o backend consultar o ViaCEP com `fetch` nativo e timeout.
- Validar oito dígitos antes da chamada e distinguir formato inválido, CEP inexistente e indisponibilidade do fornecedor.
- Usar o resultado como auxílio de preenchimento. Número e complemento permanecem sob responsabilidade do usuário.
- Manter o frontend dependente do contrato da própria API, não do formato bruto do ViaCEP.

## Alternativas consideradas

### Frontend chamar o ViaCEP diretamente

Rejeitado porque exporia o formato e as falhas do fornecedor a cada consumidor e duplicaria tratamento.

### Biblioteca de CNPJ ou CEP

Rejeitada porque as validações necessárias são pequenas e determinísticas.

### Verificar situação cadastral do CNPJ

Adiada porque exige outro fornecedor, novos contratos e tratamento de disponibilidade sem contribuir diretamente para o fluxo obrigatório do desafio.

## Consequências

- A API passa a possuir uma porta real para consulta de endereço.
- Testes usarão um adapter ViaCEP falso e não dependerão da rede.
- ViaCEP indisponível impede o preenchimento automático, mas não será reportado como CEP inexistente.
- O endereço persistido continua sendo informação declarada pelo organizador, não uma prova de regularidade empresarial.
