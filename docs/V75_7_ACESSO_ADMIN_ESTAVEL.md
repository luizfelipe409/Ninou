# Ninou v75.7 — Acesso público controlado e Admin estável

Esta versão corrige o fluxo de acesso após a implantação dos convites.

## Ajustes principais

- Visitantes/deslogados podem navegar pelas telas do app para conhecer o Ninou.
- Ações que gravam ou alteram dados continuam protegidas por login/convite.
- Ao clicar para registrar, editar, excluir, zerar ou exportar sem acesso, o app direciona para o Perfil/Login.
- O botão flutuante de adicionar registros fica oculto enquanto o usuário não possui acesso autorizado.
- O botão de WhatsApp aparece apenas para visitantes deslogados.
- A conta admin global `luizfelipe.dasilva@gmail.com` não precisa de convite.
- O admin é ativado localmente assim que entra com esse e-mail, mesmo se o Firestore ainda precisar de ajustes nas regras.
- Mensagens de sincronização ficaram menos alarmantes: se o Firestore falhar, os dados continuam preservados localmente.

## Fluxo correto

1. Visitante abre o site.
2. Pode ver telas vazias/demonstração.
3. Botão WhatsApp permanece visível enquanto estiver deslogado.
4. Se tentar registrar dados, vai para Perfil/Login.
5. Admin entra com `luizfelipe.dasilva@gmail.com`.
6. Painel Admin é liberado sem convite.
7. Admin cria convites para responsáveis, cuidadores ou visualização.

## Observação importante

O painel Admin pode abrir em modo local mesmo antes das regras do Firestore estarem perfeitas. Para criar convites e sincronizar entre celulares, as regras do Firestore precisam permitir que o admin global leia/escreva os caminhos de famílias, convites e membros.
