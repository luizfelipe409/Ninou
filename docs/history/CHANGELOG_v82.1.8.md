# Ninou v82.1.8 — soneca noturna e órbita de 24 horas

## Correções mobile

- Registros manuais de sono cujo horário final é menor que o inicial agora são interpretados como término no dia seguinte.
- O caso `18/07 20:30 → 19/07 02:30` é salvo como um sono concluído de 6 horas, sem iniciar um timer indevido.
- A confirmação diferencia corretamente **Sono registrado** de **Timer iniciado**.
- O Diário mostra início, término e duração do intervalo completo.
- A edição de um sono também reconhece automaticamente a passagem pela meia-noite.
- Um sono iniciado no dia anterior e concluído no dia atual permanece como arco na órbita durante todo o dia atual.
- O arco herdado desaparece na próxima virada de dia ou antes disso quando colidir visualmente com uma barra de sono mais recente.
- A órbita passa a consultar também o histórico do dia anterior, inclusive no armazenamento local.
- O estado ativo é preservado durante a mudança de data para evitar perder um sono em andamento ao atravessar a meia-noite.

## Versão

- Mobile: `82.1.8`.
- iOS build: `85`.
- Android versionCode: `85`.
- Aplicação web comercial da v82.1.7 preservada sem alterações em seus arquivos de execução.

Consulte `mobile/VALIDACAO_SONECA_ORBITA_v82.1.8.md`.
