# Refatoração v74.6 — Parte 6

## Foco

Esta etapa separa a lógica de alimentação, fralda e medicamento do `js/app.legacy.js`.

A mudança foi feita de forma conservadora: o app continua carregando pelo mesmo `app.js`, mantendo o arquivo legado como orquestrador, mas delegando cálculos e normalizações para módulos de domínio.

## Arquivos adicionados

### `js/domain/feeding.js`

Centraliza:

- identificação de eventos de amamentação;
- identificação de eventos de mamadeira;
- contagem de alimentações;
- leitura e soma de ml da mamadeira;
- normalização do valor da mamadeira;
- estado do timer de amamentação;
- formatação do timer E/D;
- montagem do detalhe salvo da amamentação.

### `js/domain/diaper.js`

Centraliza:

- identificação de eventos de fralda;
- contagem de fraldas;
- agrupamento por detalhe para uso futuro em estatísticas.

### `js/domain/medication.js`

Centraliza:

- identificação de eventos de medicamento;
- contagem de medicamentos;
- agrupamento por detalhe para uso futuro em estatísticas.

## Arquivos atualizados

- `js/app.legacy.js`
- `app.js`
- `styles.css`
- `index.html`
- `sw.js`
- `README.md`

## O que foi preservado

- visual atual;
- fluxo de cadastro no Diário;
- timer de amamentação E/D;
- slider de mamadeira;
- contadores da tela inicial;
- gráficos dos últimos 7 dias;
- cache PWA com novos módulos.

## Próxima etapa sugerida

A v74.7 deve separar a camada de renderização da tela inicial e relatórios:

- resumo do dia;
- últimos registros;
- gráfico de 5 dias;
- gráficos dos últimos 7 dias;
- cartões de estatísticas.
