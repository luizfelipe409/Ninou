# Limpeza do pacote Ninou v75.57.3

Este pacote foi limpo para manter somente arquivos úteis para rodar/publicar o app e configurar o Firebase.

## Mantidos

- `index.html`
- `styles.css`
- `css/`
- `app.js`
- `sw.js`
- `manifest.webmanifest`
- `js/`
- `icons/` necessários em produção
- `audio/`
- `vercel.json`
- `.gitignore`
- `README.md`
- `FIRESTORE_RULES_V75_57.rules`

## Removidos

- `.git/`
- `.vercel/`
- `.env.local`
- arquivos de snippet HTML/CSS/JS
- prompt do Codex
- checklist/testes soltos
- `teste-layout.html`, `teste-layout.css`, `teste-layout.js`
- histórico antigo da pasta `docs/`
- imagens/ícones fonte não referenciados pelo app
- arquivos de resumo/release soltos da montagem anterior

## Observação

A limpeza não altera a lógica principal do app. A versão do app continua `75.57.3`, com Perfil Familiar protegido para conta deslogada e correção de horário cross-browser.
