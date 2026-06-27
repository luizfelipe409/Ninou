# Refatoração v74.8 — Parte 8

## Foco

Esta etapa separa a lógica do modal de registro, formulários, atalhos rápidos e edição/exclusão de eventos do `js/app.legacy.js`.

A mudança continua conservadora: a aplicação ainda é orquestrada pelo arquivo legado, mas a lógica repetitiva da interface do formulário e da edição passou para módulos próprios.

## Arquivos adicionados

### `js/ui/record-sheet.js`

Centraliza:

- preenchimento das opções do select de detalhes;
- troca do tipo de registro no modal;
- estado inicial do formulário;
- hidratação do formulário ao editar um evento;
- abertura/fechamento do modal de registro;
- extração do valor final de detalhes, incluindo mamadeira e amamentação.

### `js/domain/event-editor.js`

Centraliza:

- montagem do payload de um registro manual;
- limpeza do formulário após salvar;
- texto de confirmação ao excluir evento;
- base para regras futuras de edição.

### `js/ui/navigation.js`

Centraliza:

- ligação dos atalhos rápidos com a navegação entre telas;
- base para outros binds simples de navegação.

## Arquivos atualizados

- `js/app.legacy.js`
- `app.js`
- `styles.css`
- `index.html`
- `sw.js`
- `README.md`

## O que foi preservado

- abertura do modal por tipo de registro;
- edição de eventos existentes;
- exclusão com confirmação;
- timer de amamentação E/D;
- valor de mamadeira em ml;
- atalhos rápidos da tela inicial;
- cache PWA com os novos módulos.

## Próxima etapa sugerida

A v74.9 deve separar perfil visual, tema, foto do bebê e sincronização de formulário do perfil.
Depois disso, a v74.10 pode atacar a camada de áudio/sons.
