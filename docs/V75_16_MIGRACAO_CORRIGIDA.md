# Ninou v75.16 — Migração corrigida e prioridade por UID

Esta versão corrige a migração inteligente da v75.15.

## Problema encontrado

A função que lê dados antigos em `users/{uid}` esperava receber os serviços do Firebase e o documento do usuário, mas a v75.15 chamava essa função passando apenas o documento.

Por causa disso, os dados apareciam no Firebase Console, mas o app não conseguia montar o contexto antigo para migrar para a família principal.

## Correções

- Corrigida a busca automática em `users/{uid}/profile`, `users/{uid}/days`, `users/{uid}/activities` e `users/{uid}/access/ninou`.
- Corrigida a busca manual por UID.
- A busca manual agora tem prioridade sobre fontes automáticas.
- Fontes associadas ao Francisco têm prioridade sobre dados antigos/de teste com score maior.
- Cache do app atualizado para `75.16`.

## Onde os dados ficam após a migração

- Perfil, foto e pesos: `families/ninou-family-luizfelipe/profile/main`
- Rotina diária: `families/ninou-family-luizfelipe/days/{AAAA-MM-DD}`
- Membros autorizados: `families/ninou-family-luizfelipe/members/{uid}`
- Acesso individual da conta: `users/{uid}/access/ninou`

## Onde estavam os dados antigos vistos no vídeo

- Atividades antigas da conta Francisco: `users/LPUmw9E7K5UsVcKHGZ1pVBMpOtm1/activities`
- Perfil/foto/pesos antigos vistos no vídeo: `users/tXuGSKFvjnX2mZMwZVW0fSO7KiX2/profile/main`
- Dias antigos vistos no vídeo: `users/tXuGSKFvjnX2mZMwZVW0fSO7KiX2/days/{AAAA-MM-DD}`

> Atenção: no vídeo, o perfil desse UID aparece com nome `Ravi`. Confira antes de migrar esse UID se ele realmente pertence aos dados corretos do Francisco.
