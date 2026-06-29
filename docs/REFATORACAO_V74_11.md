# Refatoração v74.11 — Parte 11

## Foco

Esta etapa separa a navegação principal, a bottom nav, o controle horizontal dos filtros do Diário, estados vazios e utilitários gerais de renderização.

## Novos módulos

### `js/ui/app-navigation.js`

Centraliza:

- alternância de telas;
- marcação do botão ativo na bottom nav;
- clique do status de sincronização para abrir o Perfil;
- controle de rolagem horizontal dos filtros do Diário;
- atualização automática do botão de avançar/voltar filtros.

### `js/ui/empty-states.js`

Centraliza:

- item vazio da timeline;
- markup de último registro vazio;
- base para estados vazios futuros.

### `js/ui/render-utils.js`

Centraliza utilitários seguros de renderização:

- atualização de `innerHTML` somente quando necessário;
- limpeza de elementos;
- inclusão de filhos;
- criação simples de elementos.

## Integração feita no `js/app.legacy.js`

- `showScreen()` agora delega a troca de telas para `updateScreenVisibility()`.
- A bottom nav agora é ligada por `bindBottomNavigation()`.
- O clique no status de sincronização agora é ligado por `bindSyncPillNavigation()`.
- O botão horizontal dos filtros usa `createHorizontalScrollToggle()`.
- O estado vazio da timeline usa `createEmptyTimelineItem()`.
- O estado vazio do último registro usa `getLatestEmptyRecordMarkup()` e `setHtml()`.

## Comportamento

O comportamento visual e funcional foi preservado. Esta etapa apenas remove mais responsabilidades do arquivo legado e cria uma base melhor para a próxima separação.

## Validação

- `node --check` nos arquivos JavaScript principais.
- Teste de importação dos novos módulos.
- ZIP gerado com a estrutura completa do projeto.
