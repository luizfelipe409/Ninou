# v75.19 — Admin responsivo

Correção visual para o painel administrativo do Ninou.

## Problema

Na conta admin, a tela podia parecer partida ou com zoom, especialmente quando o painel exibia e-mails, UIDs ou caminhos longos do Firestore.

## Causa

A tela de perfil aplicava regras globais para `span`, incluindo caixa alta e espaçamentos, e alguns textos longos do admin não tinham quebra forçada. Isso podia gerar overflow horizontal no mobile.

## Correção

- `body.global-admin-mode .phone-shell` agora usa largura fluida até 720px.
- Elementos internos do admin receberam `min-width: 0`, `max-width: 100%` e `overflow-wrap: anywhere`.
- Botões e campos do admin ocupam 100% no mobile.
- Caminhos longos do Firestore quebram linha corretamente.
- O texto do admin não herda caixa alta indevida da lista de configurações.
