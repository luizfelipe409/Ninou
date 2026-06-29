# v75.42.1 — Admin online estável

Correção focada no caso em que o usuário entra como admin global, mas o app mostra "Off-line".

## Ajustes

- Admin global autenticado não é rebaixado visualmente para "Off-line" por falhas auxiliares do Firestore.
- `activatePersonalFamily()` mantém status online quando o admin está logado.
- `setSyncStatus()` protege o status visual do admin global.
- Mensagens de erro do Firestore passam a orientar revisão de regras, sem confundir com ausência de login.

## Validação

- Entrar com `luizfelipe.dasilva@gmail.com`.
- Confirmar que a pílula mostra Online/Conectado.
- Confirmar que o painel admin aparece.
- Se contagens/convites falharem, a mensagem deve orientar regras do Firestore, não mostrar visitante/off-line.
