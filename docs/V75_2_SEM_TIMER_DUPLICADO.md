# Ninou v75.2 — Sem timer duplicado

Correção de UX na tela Hoje.

## Ajuste principal

O card central já informa o estado atual:

- Dormindo há
- Acordado há
- Despertar noturno há

Por isso, o card menor de “Timer de sono” foi removido da tela inicial para evitar que o usuário veja dois cronômetros com o mesmo sentido.

## Regra da tela Hoje

- O tempo atual aparece apenas no card central.
- A ação fica no botão principal abaixo do card central.
- Se estiver dormindo, o botão mostra “Acordou”.
- Se estiver acordado, o botão mostra “Iniciar soneca”.
- Se houver despertar noturno ativo, o botão mostra “Voltou a dormir”.

## Arquivos atualizados

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `js/services/timer-service.js`
- `css/app.legacy.css`
