# Ticket Overlord

Plataforma de eventos e ingressos desenvolvida para o desafio técnico **Verzel Elite Dev 2026**.

O produto permitirá que um organizador publique eventos a partir de um catálogo externo, clientes reservem e comprem ingressos com pagamento simulado e profissionais de portaria validem os ingressos por QR Code ou código manual.

> **Status:** planejamento. A aplicação ainda não foi implementada ou publicada.

## Fluxo principal

1. O organizador cria e publica um evento.
2. O cliente encontra o evento e reserva ingressos.
3. O pagamento simulado é confirmado ou recusado.
4. Um pagamento confirmado gera um ingresso não forjável.
5. O cliente visualiza e compartilha o ingresso.
6. A portaria valida o ingresso uma única vez.

## Stack planejada

- Next.js, React e TypeScript no frontend.
- NestJS e TypeScript sobre Node.js LTS no backend.
- PostgreSQL com Drizzle ORM.
- PostgreSQL Full Text Search na primeira versão.
- Railway para deploy.

As justificativas e consequências dessas escolhas estão registradas nas decisões técnicas.

## Documentação

Toda a documentação necessária para desenvolver e avaliar o projeto é versionada neste repositório.

| Documento | Conteúdo |
| --- | --- |
| [`challenge.md`](./challenge.md) | Enunciado normalizado e critérios de sucesso do desafio. |
| [`docs/decisoes/index.md`](./docs/decisoes/index.md) | Índice cronológico das decisões técnicas aprovadas. |
| [`AGENTS.md`](./AGENTS.md) | Contexto e regras locais para agentes que trabalham no projeto. |

O repositório é a fonte oficial da documentação. Páginas externas podem ser usadas como material de apresentação no futuro, mas não substituirão os arquivos versionados.

## Execução local

Ainda não disponível. Os comandos de instalação, configuração do banco, migrations, seeds e inicialização serão adicionados somente depois de validados.

## Dados de demonstração esperados

- Um organizador.
- Dois clientes.
- Um usuário de portaria.
- Ao menos um evento publicado com ingressos disponíveis.

As credenciais serão registradas após a implementação e validação dos seeds.

## Uso de IA

ChatGPT e Codex estão sendo utilizados na análise do desafio, nas discussões de arquitetura e na documentação. As decisões são revisadas e aprovadas pelo desenvolvedor. O histórico de uso, as contribuições manuais e as limitações serão atualizados conforme o projeto evoluir.
