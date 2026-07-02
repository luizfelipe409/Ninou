# v75.41 — Somente avatar

Esta versão remove o uso visual de fotos do bebê e do admin.

## Regras

- O bebê deve ser representado somente por avatar.
- Fotos antigas salvas localmente ou no Firestore são ignoradas.
- Novos uploads de foto não são aceitos.
- O perfil do bebê mostra o avatar configurado.
- O painel admin mostra avatares diferentes para admin, famílias, membros, convites e usuários conhecidos.
- O app não usa Firebase Storage.
- O app não salva novas imagens/base64 como fluxo principal.

## Compatibilidade

Dados antigos não são apagados à força do banco, mas deixam de ser usados na interface. Ao salvar o perfil novamente, os campos antigos de foto são sobrescritos como vazios no documento de perfil.
