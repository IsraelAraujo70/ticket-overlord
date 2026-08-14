# Relatórios operacionais por organização

- **Status:** Aceita
- **Decidida em:** 2026-08-14 16:30:03 -03:00

## Contexto

O painel administrativo mantinha Visão geral, Ingressos e Pedidos como áreas temporárias. O desafio considera positivamente um dashboard do organizador, enquanto o fluxo implementado já persiste compras aprovadas, ingressos emitidos e check-ins. Uma compra pode emitir vários ingressos, mas o produto ainda não mantém recusas, reembolsos ou cancelamentos como histórico financeiro durável.

## Decisão

- Substituir Visão geral por um resumo operacional de compras aprovadas, ingressos vendidos, receita confirmada e check-ins.
- Criar em Ingressos um relatório paginado por evento com métricas do período e ocupação acumulada.
- Oferecer períodos móveis de 7, 30 e 90 dias, além de todo o histórico, com 30 dias como padrão.
- Aplicar o período às compras, ingressos vendidos, receita e check-ins. Capacidade, disponibilidade e ocupação continuam acumuladas por evento.
- Limitar organizadores à própria organização na API.
- Permitir ao `ADMIN` consultar a agregação global somente leitura, identificando a organização de cada evento.
- Manter `ORGANIZER_STAFF` restrito à portaria.
- Remover Pedidos da navegação enquanto não houver operação própria de cancelamento, reembolso ou atendimento.
- Implementar as consultas em um módulo de relatórios, sem duplicar dados ou criar tabelas agregadas.

## Alternativas consideradas

### Manter uma página de Pedidos

Rejeitada nesta etapa. Ela repetiria as compras aprovadas já resumidas em Ingressos e sugeriria suporte a estados financeiros que não são persistidos.

### Adicionar gráficos e uma dependência de visualização

Rejeitada. Os números operacionais e as barras de ocupação existentes comunicam o estado atual sem ampliar dependências ou criar gráficos com pouco histórico demonstrativo.

### Alterar o contrato de eventos existente

Rejeitada. Agregações atravessam eventos, reservas, pagamentos e ingressos. Um módulo de leitura separado preserva o contrato e a responsabilidade do gerenciamento de eventos.

### Persistir snapshots de métricas

Rejeitada. O volume e o prazo do desafio não justificam sincronização, invalidação ou uma segunda fonte de verdade.

## Consequências

- Os relatórios são derivados do PostgreSQL no momento da consulta.
- O filtro representa uma janela móvel terminada no instante da requisição, não dias civis fechados.
- O relatório não apresenta tentativas recusadas porque elas não são duráveis no modelo atual.
- Crescimento significativo do histórico poderá exigir índices adicionais ou agregações assíncronas, mas isso fica fora do escopo da entrega.
