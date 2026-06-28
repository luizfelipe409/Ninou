# Ninou v75.4 — Convites administrativos

## O que foi implementado

- Novo card de Administração familiar no Perfil.
- Fluxo de convite por código/link.
- Geração de convite por e-mail e perfil de acesso.
- Aceite de convite por usuário autenticado.
- A rotina familiar passa a usar o caminho `families/{familyId}` no Firestore quando existe acesso familiar.
- Acesso às funções principais exige conta vinculada a uma família.
- Perfis básicos de permissão:
  - Administrador: gerencia convites e pode alterar tudo.
  - Responsável: pode registrar, editar, excluir e configurar.
  - Cuidador: pode registrar e acompanhar, mas não editar/excluir/configurar dados sensíveis.
  - Visualização: acompanha sem alterar.

## Importante

O app web não usa Firebase Admin SDK. Por isso, o administrador não cria a senha de outra pessoa. Ele gera um convite; o familiar entra/cria sua própria conta e aceita o código.

Para bloquear acesso indevido de verdade, aplique as regras de Firestore em produção.
