# Ninou v75.5 — Admin global por convite

Esta versão transforma o painel de administração em um painel exclusivo do e-mail dono do app:

`luizfelipe.dasilva@gmail.com`

## O que mudou

- Somente o e-mail admin vê o painel de convites.
- Convidados não veem o painel Admin, mesmo que tenham acesso à rotina familiar.
- A família principal do app é ativada automaticamente para o admin global ao entrar.
- O admin pode convidar usuários por e-mail e escolher permissões:
  - Responsável
  - Cuidador
  - Visualização
- A opção de convidar outro administrador foi removida da interface.
- Usuários sem convite ficam bloqueados nas funções principais e são direcionados ao Perfil/Login.
- A v75.3/v75.4 foi preservada, incluindo a correção visual da Rotina do dia sem sobreposição.

## Importante

Para segurança real em produção, aplique as regras sugeridas em:

`docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_5.md`

O frontend esconde o painel, mas quem realmente protege os dados é o Firestore.

## v75.7 — Acesso público controlado e Admin estável

- Visitantes podem navegar pelas telas sem login.
- Ações de gravação continuam exigindo conta autorizada.
- Botão de adicionar fica oculto sem acesso.
- WhatsApp aparece apenas para visitantes deslogados.
- Admin global `luizfelipe.dasilva@gmail.com` não precisa de convite e é liberado automaticamente.
- Cache atualizado para `ninou-v75-7-acesso-admin-estavel`.

## v75.6 — Admin, WhatsApp e contagem de usuários

- Botão pequeno de WhatsApp para visitantes sem acesso.
- Mensagem pronta de interesse ao admin.
- Número configurado: +55 21 98190-4591.
- Painel Admin exclusivo para `luizfelipe.dasilva@gmail.com`.
- Contagem de usuários autorizados/vinculados à família.
- Contagem de convites pendentes e aceitos.
- Cache atualizado para `ninou-v75-6-admin-whatsapp-users`.
