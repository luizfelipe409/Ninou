# Changelog

## 83.0.2 — correções da rotina mobile

- Calendário próprio de dia, mês e ano.
- Primeiro acesso com primeiro despertar, estado atual e início do período atual.
- Proteção contra alternâncias acidentais e registros duplicados.
- Agrupamento e detalhamento dos marcadores da órbita revisados.
- Web mantida idêntica à base 83.0.0.

## 83.0.0 — base consolidada de lançamento

- Web reduzida a uma única folha CSS comum e uma folha administrativa condicional.
- Boot, núcleo, painel e serviço administrativo mantidos em arquivos únicos com nomes estáveis.
- Menu, live wallpaper, estabilidade de toque e fluxos mobile/web incorporados ao shell principal.
- Arquivos versionados e camadas antigas removidos da fonte e do build.
- Raiz e `dist/` passam a ser gerados a partir da mesma fonte.
- Service Worker atualizado para a estrutura consolidada, sem pré-carregar recursos administrativos para famílias clientes.
- Mobile alinhado à versão 83.0.0 e build 88.
- Versão mobile centralizada em `src/config/release.ts`.
- Arquivos locais do Xcode removidos do pacote.
- Documentação e validações históricas movidas para `docs/history/`.
- Regressões de órbita, menus, acesso comercial, admin, validade e exclusão preservadas.
