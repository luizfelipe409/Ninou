# Ninou v75.58.1 — Correção exclusão + Acordou

Base: v75.58 — Base Multi-Família + PWA Confiável.

## Correções

### 1. Exclusão de registros
- Corrigido o caso em que um registro excluído podia reaparecer após renderização, troca de tela, cache local ou sincronização.
- O cache por família/dia agora preserva marcadores de exclusão (`deletedEventIds`) mesmo quando o dia fica sem registros visíveis.
- A montagem da timeline e dos relatórios agora filtra eventos marcados como excluídos.
- A exclusão continua registrada no histórico técnico de ajustes, mas o registro removido não deve voltar para a lista principal.

### 2. Acordou
- Ajustada a criação manual de registros do tipo `Acordou`.
- Ao registrar manualmente, o app bloqueia apenas duplicidade no mesmo minuto, não mais uma janela acordada inteira.
- Isso permite corrigir/adicionar `Acordou` em dias anteriores sem o app confundir com o estado ativo do cronômetro.
- Ao revisar datas anteriores, o estado ao vivo deixa de interferir no diário histórico.

### 3. Data anterior
- Ao abrir um dia passado no Diário, o card de estado passa a indicar que é uma data selecionada/histórica.
- O app não tenta recalcular o cronômetro ativo com base em dias anteriores.

## Versão/cache

- `NINOU_APP_VERSION = 75.58.1`
- Cache PWA: `ninou-v75-58-1-bugfix-exclusao-acordou`
