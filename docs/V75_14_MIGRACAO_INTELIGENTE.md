# Ninou v75.14 — Migração inteligente por UID

Esta versão corrige o caso em que o Firestore mostra `users/{uid}/activities`, mas o app não encontra dados automaticamente.

## Por que acontecia

No Firestore é possível existir uma subcoleção em `users/{uid}/activities` mesmo que o documento raiz `users/{uid}` não tenha dados. Nesse caso, a busca por `collection('users')` pode não retornar esse UID como origem recuperável.

## O que mudou

- A busca automática agora tenta `collectionGroup` em:
  - `activities`
  - `days`
  - `profile`
  - `access`
- A migração não ignora mais dados legados que estejam na própria conta admin.
- A tela Admin agora tem campo manual para colar o UID antigo visto no Firebase Console.
- O botão **Buscar por UID** lê diretamente:
  - `users/{uid}/activities`
  - `users/{uid}/days`
  - `users/{uid}/profile`
  - `users/{uid}/access/ninou`
- Os dados encontrados podem ser migrados para:
  - `families/ninou-family-luizfelipe/profile/main`
  - `families/ninou-family-luizfelipe/days/{dia}`

## Como usar

1. Publique as regras `docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_14.md`.
2. Entre como admin: `luizfelipe.dasilva@gmail.com`.
3. Vá em Perfil > Administração do Ninou > Dados da família.
4. Se a busca automática não encontrar, copie o UID do Firebase Console.
5. Cole no campo “UID da conta antiga”.
6. Toque em “Buscar por UID”.
7. Toque em “Migrar dados encontrados”.

Não apague `users`, `activities`, `families`, `members`, `invites` nem `access` antes da migração.
