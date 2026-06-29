# Ninou v74.14 — Sono manual e base local-first

Esta etapa prioriza funcionalidade real no uso diário.

## Entregas

- Campo **Fim** no modal para Soneca, Sono noturno e Despertar noturno.
- Edição de início e fim de registros de sono sem precisar apagar o evento.
- Cálculo de duração no próprio modal antes de salvar.
- Cálculo e persistência da janela acordado no registro de sono sempre que houver um despertar anterior válido.
- O Diário passa a exibir a janela acordado associada ao sono.
- Registros salvos localmente mesmo sem login; o Firebase passa a ser camada de sincronização, não bloqueio de uso.
- Atualização do cache para v74.14.

## Observação

A v74.14 mantém o `js/app.legacy.js` como orquestrador principal, mas melhora a regra de domínio de sono e prepara o projeto para a próxima etapa de insights.
