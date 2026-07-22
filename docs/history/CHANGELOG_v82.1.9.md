# Ninou v82.1.9 — recorte progressivo da órbita noturna

## Correção mobile

- O sono iniciado no dia anterior e finalizado depois da meia-noite continua representado na órbita do dia atual no horário real em que ocorreu.
- O arco herdado não é mais removido por inteiro quando o relógio do dia atual alcança novamente o mesmo trecho da órbita.
- A parte anterior à meia-noite é recortada progressivamente somente a partir do horário atual ou do início de uma barra mais recente que colida com ela.
- A parte real entre `00:00` e o término do sono permanece visível e independente do recorte do trecho noturno anterior.
- O encontro visual em `00:00` não cria falsos marcadores de início ou término.
- Colisões com barras atuais preservam os trechos não conflitantes do registro antigo.

## Exemplo validado

Para um sono de `19/07 às 21:34` até `20/07 às 02:00`:

- às `06:43`, a órbita mostra `21:34 → 00:00 → 02:00`;
- às `21:20`, o arco continua completo;
- às `23:15`, ficam visíveis `21:34 → 23:15` e `00:00 → 02:00`;
- somente `23:15 → 00:00` é ocultado;
- após a virada para `21/07`, o registro deixa de pertencer à órbita atual.

## Versão

- Mobile: `82.1.9`.
- iOS build: `86`.
- Android versionCode: `86`.
- Aplicação web comercial da v82.1.7 preservada sem alteração funcional.

Consulte `mobile/VALIDACAO_ORBITA_PROGRESSIVA_v82.1.9.md`.
