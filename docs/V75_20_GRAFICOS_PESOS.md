# v75.20 — Gráficos familiares e pesos migrados

## Problema observado

Após a migração, os registros estavam em `families/ninou-family-luizfelipe/days`, mas os gráficos de últimos dias ainda calculavam quase tudo a partir do `state.events` do dia aberto. Por isso, alguns dados só apareciam quando a data específica era selecionada no diário.

Também havia risco de o peso migrado não aparecer quando o formato antigo dos pesos não era exatamente `weights: [{ date, value }]` ou quando o cache local tinha perfil sem pesos com `clientUpdatedAt` mais recente.

## Correções

- Criado cache de estados familiares por data (`familyDayStatesCache`).
- `loadFamilyDayIds()` agora também carrega e normaliza o conteúdo dos documentos de cada dia.
- Gráficos de últimos 7 dias usam os dias da família, não apenas o dia selecionado.
- Relatório de sono e gráficos de mamadeira, fraldas e medicamentos usam a visão familiar agregada.
- Mini gráfico dos últimos dias usa os eventos familiares recentes.
- Migração de pesos aceita mais aliases e formatos antigos.
- Migração também tenta ler `users/{uid}/weights` e `users/{uid}/pesos`.
- Perfil em nuvem com pesos/foto pode sobrescrever cache local vazio de pesos/foto.

## Regras

Use `FIRESTORE_RULES_ADMIN_GLOBAL_V75_20.md` para liberar a leitura admin de `weights` e `pesos` legados.
