# Áreas administrativas em construção

## Resultado observável

O painel autenticado continuará exibindo header, conta e menu lateral, mas não apresentará métricas ou eventos demonstrativos. Os cinco itens do menu serão navegáveis e renderizarão o mesmo componente de estado temporário:

- `/admin`: Visão geral.
- `/admin/eventos`: Eventos.
- `/admin/ingressos`: Ingressos.
- `/admin/pedidos`: Pedidos.
- `/admin/portaria`: Portaria.

Cada rota mostrará `UnderConstruction` com o nome da área atual. Rotas administrativas desconhecidas continuarão retornando 404.

## Implementação

1. Criar um componente reutilizável `UnderConstruction`, visualmente integrado ao Ticket Overlord e acessível em desktop e mobile.
2. Substituir o conteúdo de `/admin` pelo novo componente.
3. Criar uma rota dinâmica restrita às quatro seções adicionais.
4. Transformar todos os itens da sidebar em links e manter o destaque da rota ativa.
5. Remover o dashboard demonstrativo e o card de métricas, que ficarão sem uso.
6. Atualizar o índice de documentação do README.

## Validação

- Teste do conteúdo e identificação da seção no componente.
- Teste dos cinco links e do estado ativo da sidebar.
- Teste das rotas válidas e da rejeição de seção desconhecida.
- `pnpm lint`, `pnpm test`, `pnpm build` e `git diff --check`.
- Verificação visual do layout em desktop e mobile.

## Fora do escopo

- Implementar eventos, ingressos, pedidos ou portaria.
- Alterar autenticação, papéis ou sessões.
- Alterar API, banco de dados, migrations ou seeds.
- Deploy.
