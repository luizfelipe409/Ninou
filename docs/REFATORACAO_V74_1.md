# Ninou v74.1 — Refatoração Parte 1

Esta etapa inicia a refatoração sem alterar o comportamento do aplicativo.

## O que mudou

- `app.js` agora é apenas um carregador leve.
- A lógica estável da v73 foi movida para `js/app.legacy.js`.
- `styles.css` agora é apenas um carregador leve.
- O CSS estável da v73 foi movido para `css/app.legacy.css`.
- O Service Worker foi atualizado para cachear os novos caminhos.
- A versão de cache foi atualizada para `ninou-v74-1-refactor`.

## Por que essa etapa é segura

A lógica do aplicativo e o visual foram preservados. Esta etapa cria a nova arquitetura sem reescrever funcionalidades.

## Próxima etapa sugerida

v74.2 deve extrair utilitários e configurações de `js/app.legacy.js` para módulos menores:

- `js/utils/dates.js`
- `js/utils/formatters.js`
- `js/config/firebase.js`
- `js/config/record-types.js`
- `js/storage/local-storage.js`

A cada extração, o app deve continuar funcionando antes de avançar para a próxima.
