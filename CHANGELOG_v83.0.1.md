# Ninou 83.0.2 — correções da rotina mobile

## Escopo

A lógica da aplicação web permanece idêntica à base 83.0.0; apenas a identificação de versão e o cache foram alinhados para 83.0.2.

## Correções

- Novo seletor próprio de data de nascimento com colunas de dia, mês e ano, sem depender do seletor nativo que aparecia vazio no Expo Go.
- Primeiro acesso reorganizado em três etapas:
  1. primeiro despertar do dia;
  2. estado atual do bebê;
  3. horário em que o período atual começou, tanto para acordado quanto para dormindo.
- Alternâncias acidentais entre acordado e dormindo bloqueadas quando ocorrem em menos de 2 minutos.
- Ações repetidas que não representam mudança de estado deixam de criar registros duplicados.
- Sono manual concluído com menos de 2 minutos é rejeitado.
- Agrupamento da órbita calculado pela colisão visual dos marcadores, sem agrupamento em cadeia.
- Grupos próximos da meia-noite mantêm ordem circular correta.
- Badge `×N` ampliado e painel de grupo com horários, detalhes e responsável de cada ação.
- Marcador do estado em andamento se desloca para dentro quando poderia encobrir um agrupamento.

## Versão mobile

- Versão: 83.0.2
- Build iOS: 89
- versionCode Android: 89
