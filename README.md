# Ninou v75.15 — Contraste Admin + Migração inteligente

Versão focada em recuperar dados antigos que ficaram em caminhos legados do Firestore.

## Principais ajustes

- Busca por `collectionGroup` em `activities`, `days`, `profile` e `access`.
- Campo manual para buscar diretamente pelo UID antigo do Firebase.
- Não ignora mais dados antigos salvos na própria conta admin.
- Migração para a família principal `ninou-family-luizfelipe`.
- Cache atualizado para `ninou-v75-15-contraste-admin`.

## Obrigatório

Publique as regras:

`docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_15.md`

Depois faça hard refresh ou reinstale o PWA no iPhone.


## v75.15 — Correção visual do Admin

- Corrigido contraste dos campos no tema claro.
- Labels como “E-mail do convidado”, “Permissão” e “UID da conta antiga” ficaram mais escuros.
- Mensagens de status e listas vazias da área Dados da família ficaram legíveis.
- Inputs, selects e botões administrativos agora usam cores mais fortes no tema claro.

