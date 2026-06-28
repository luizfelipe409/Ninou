# Ninou v75.8 — Correção Firestore/Convites

Esta versão corrige o fluxo de criação de convites quando o Firestore ainda não permite a escrita do admin global.

## Melhorias

- O convite agora é criado primeiro em `invites/{codigo}`.
- O espelho em `families/{familyId}/invites/{codigo}` virou tentativa secundária, sem quebrar a criação do convite.
- O aceite do convite grava o `inviteCode` no acesso do usuário, facilitando regras Firestore mais seguras.
- A mensagem de erro de permissão ficou mais direta: publicar as regras v75.8 e confirmar login com `luizfelipe.dasilva@gmail.com`.
- Cache atualizado para `ninou-v75-8-firestore-convites`.

## Passo obrigatório

Publique `docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_8.md` no Firebase Console.
