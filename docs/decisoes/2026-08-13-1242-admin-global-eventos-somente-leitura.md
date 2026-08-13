# Eventos globais somente leitura para administradores

- **Status:** Aceita
- **Decidida em:** 2026-08-13 12:42:27 -03:00

## Contexto

A decisão de identidade preparou o papel `ADMIN`, mas adiou seu painel global. Ao reutilizar a tela administrativa de eventos, a API exigia vínculo com uma organização e devolvia `403` para esse papel. O frontend convertia essa falha de autorização em uma mensagem genérica sobre indisponibilidade da API, do PostgreSQL ou do armazenamento, embora os serviços estivessem saudáveis.

O administrador global precisa inspecionar a programação completa sem assumir a identidade de uma organização e sem receber permissão para alterar seus eventos.

## Decisão

- `GET /events` continua limitado à própria organização para `ORGANIZER` e retorna eventos de todas as organizações para `ADMIN`.
- `GET /events/:eventId/cover` segue a mesma regra de visibilidade.
- O painel oculta ações de criação e publicação quando a sessão pertence a um `ADMIN`.
- As operações de criação e publicação continuam exigindo um `ORGANIZER` vinculado à organização do evento.
- Não será criada uma organização artificial para representar o administrador global.

Esta decisão amplia apenas a parte da decisão de identidade que havia adiado o painel global. As demais regras de papéis e organizações permanecem válidas.

## Alternativas consideradas

### Criar uma organização global

Rejeitada porque misturaria uma identidade administrativa com o isolamento entre organizações e poderia atribuir eventos a um tenant artificial.

### Permitir alterações globais ao administrador

Rejeitada porque o requisito atual é de consulta. Alterações globais exigiriam regras adicionais de auditoria, confirmação e responsabilidade pela organização.

### Criar endpoints exclusivos para o administrador

Rejeitada neste momento porque a representação e a paginação ainda são as mesmas. A autorização por papel no caso de uso existente mantém o contrato menor sem enfraquecer o bloqueio das mutações.

## Consequências

- O armazenamento de eventos expõe consultas globais explícitas, separadas das consultas por organização.
- O frontend usa o papel autenticado para apresentar o painel no modo somente leitura.
- A API, e não apenas a interface, mantém criação e publicação bloqueadas para `ADMIN`.
- Filtros por organização, auditoria e qualquer mutação administrativa futura precisarão de uma nova decisão.
