# Refatoração v74.7 — Parte 7

## Foco

Esta etapa separa a lógica de tela inicial e gráficos do `js/app.legacy.js`.

A mudança continua conservadora: o arquivo legado ainda orquestra a aplicação, mas agora delega cálculos e renderizações recorrentes para módulos específicos de UI.

## Arquivos adicionados

### `js/ui/home.js`

Centraliza:

- cálculo dos eventos de hoje;
- resumo de sono, acordado, mamadas, fraldas e medicamentos;
- dados do cartão de próxima soneca;
- renderização dos últimos registros da tela inicial.

### `js/ui/charts.js`

Centraliza:

- criação da janela de dias para relatórios;
- criação dos dias de sono;
- formatação numérica dos gráficos;
- renderização de barras;
- gráfico compacto dos últimos 5 dias na tela inicial.

## Arquivos atualizados

- `js/app.legacy.js`
- `app.js`
- `styles.css`
- `index.html`
- `sw.js`
- `README.md`

## O que foi preservado

- visual atual;
- resumo da tela inicial;
- últimos 5 registros;
- gráfico compacto dos últimos 5 dias;
- gráficos dos últimos 7 dias;
- relatório de sono;
- cache PWA com os novos módulos.

## Próxima etapa sugerida

A v74.8 deve separar a camada de formulários e modal de registro:

- abertura/fechamento do modal;
- campos por tipo de registro;
- edição de registros;
- atalhos rápidos;
- validação de dados antes de salvar.
