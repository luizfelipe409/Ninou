# Ninou v74.15 — Correção de carregamento

Correção aplicada após o aviso: "Não foi possível carregar o aplicativo".

## Ajuste principal

- Corrigido `async async function getFirebaseServices()` em `js/app.legacy.js`.
- Atualizadas as versões dos assets para `v74.15`.
- Atualizado o cache do Service Worker para `ninou-v74-15-carregamento`.
- `index.html` passa a carregar `app.js` como módulo.

## Validação

- Sintaxe de todos os arquivos JS validada como módulo ES.
- Importação do módulo principal testada com stubs de navegador.
