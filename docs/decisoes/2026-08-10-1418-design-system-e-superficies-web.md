# Design system e superfícies web

- **Status:** Aceita
- **Decidida em:** 2026-08-10 14:18:45 -03:00

## Contexto

O produto precisa atender clientes e organizadores no mesmo domínio. A área pública exige identidade própria e navegação orientada à descoberta de eventos, enquanto o painel administrativo pode priorizar previsibilidade e velocidade de implementação. O projeto já adotou Next.js e precisa manter o fluxo obrigatório como prioridade dentro do prazo do desafio.

## Decisão

- Manter uma única aplicação Next.js em `apps/web`.
- Servir a experiência pública em `/` e a superfície administrativa em `/admin`.
- Usar Tailwind CSS v4 e shadcn/ui com Base UI e o preset Nova.
- Manter os componentes gerenciados pelo shadcn em `components/ui` e organizar componentes próprios em `atoms`, `molecules`, `organisms` e `templates`.
- Adaptar o shell administrativo já utilizado em `message-reservation-system/apps/admin`, sem copiar regras de negócio ou integrações daquele produto.
- Usar uma linguagem visual de cartazes e canhotos de ingresso na superfície pública, preservando uma apresentação neutra e operacional no admin.
- Nesta fundação, manter `/admin` e `/admin/login` sem autenticação real e sem dados sensíveis. A proteção de rota dependerá de uma decisão posterior sobre sessão e autorização integradas à API.

## Alternativas consideradas

### Aplicações independentes para público e admin

Rejeitada nesta etapa. Separar builds e deploys aumentaria configuração e duplicaria a infraestrutura visual sem benefício proporcional ao escopo atual.

### Copiar integralmente o shadcn-admin

Rejeitada. O projeto de referência usa Vite e TanStack Router, enquanto o Ticket Overlord usa Next.js App Router. Foram reaproveitados os padrões de composição, não a arquitetura nem componentes modificados do template.

### Componentes próprios sem shadcn/ui

Rejeitada porque aumentaria o esforço de acessibilidade e manutenção de primitivas comuns como sidebar, sheet, tooltip, cards e campos de formulário.

## Consequências

- Público e admin compartilham tokens, tipografia e primitivas sem compartilhar linguagem visual completa.
- `components/ui` permanece reconhecível como código de registry e os componentes de produto ficam separados por responsabilidade visual.
- A área administrativa desta etapa é apenas uma demonstração visual e não deve ser tratada como protegida.
- A futura autenticação precisa proteger tanto as rotas de página quanto as operações da API; esconder controles no frontend não será suficiente.
