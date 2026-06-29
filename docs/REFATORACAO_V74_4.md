# Ninou v74.4 — Refatoração Parte 4

Esta etapa continuou a refatoração de forma incremental, sem alterar a proposta visual do app.
O foco foi retirar do `js/app.legacy.js` parte da responsabilidade sobre registros, estado do dia, Diário e exportação.

## Novos módulos

### `js/domain/records.js`

Centraliza a base dos registros da rotina:

- criação de estado vazio do dia;
- criação de evento;
- normalização de tipos antigos/alternativos;
- normalização de evento;
- normalização do estado do dia;
- busca de registro por ID;
- ordenação de registros;
- filtro de registros por dia;
- filtro por categoria do Diário;
- edição preservando duração;
- remoção de registro por ID.

Esse módulo prepara o app para a próxima fase de sono editável, porque deixa a regra dos registros fora da tela.

### `js/ui/event-formatters.js`

Centraliza a apresentação textual e visual dos registros:

- linha de horário/duração/detalhe;
- assinatura de renderização do evento;
- assinatura de renderização do Diário;
- HTML do card do Diário;
- HTML dos últimos registros da tela inicial.

Essa separação reduz duplicação e deixa mais seguro evoluir o layout dos cards.

### `js/services/export-service.js`

Centraliza a montagem dos eventos exportados em JSON/CSV.

O `app.legacy.js` ainda decide quando exportar, mas a transformação dos registros para payload agora está isolada.

## Arquivos atualizados

- `app.js` atualizado para v74.4;
- `styles.css` atualizado para v74.4;
- `index.html` atualizado para carregar `v=74.4`;
- `sw.js` atualizado para cache `ninou-v74-4-refactor`;
- `js/app.legacy.js` passou a delegar registros/Diário/exportação aos novos módulos.

## Validação

Foram validados com `node --check`:

- `app.js`;
- `sw.js`;
- `js/app.legacy.js`;
- `js/domain/records.js`;
- `js/ui/event-formatters.js`;
- `js/services/export-service.js`.

## Próxima etapa sugerida

A v74.5 deve separar a lógica de timers e sono:

- estado acordado/dormindo;
- timer ativo;
- despertar noturno;
- início de soneca/noite;
- fim de sono;
- base para registro `Acordou` editável.
