# Ninou v75.10 — Convites estáveis e aceite corrigido

Esta versão corrige o fluxo observado no vídeo: o convite era criado, mas ao aceitar nada ficava claro, os pendentes aumentavam a cada tentativa e o convidado não conseguia entrar na rotina familiar.

## Correções principais

- O botão **Aceitar convite** agora mostra estado de carregamento: `Aceitando convite...`.
- Ao aceitar com sucesso, o convite muda para `accepted` e deixa de contar como pendente.
- A área de aceitar convite fica oculta quando a conta já está vinculada à família.
- O mesmo e-mail não gera infinitos convites pendentes: o app usa um código estável por e-mail/família.
- Convites pendentes duplicados antigos do mesmo e-mail são marcados como `cancelled` quando um novo convite estável é gerado.
- A contagem do Admin agora considera os convites globais em `invites/{codigo}` e conta e-mails únicos.
- O espelho em `families/{familyId}/invites/{codigo}` continua opcional e não quebra o fluxo se falhar.
- O convidado, após aceitar, é direcionado para a tela Hoje e passa a ler a rotina da família principal.
- O admin global continua sendo `luizfelipe.dasilva@gmail.com` e não precisa de convite.

## Dinâmica correta

1. Admin entra com `luizfelipe.dasilva@gmail.com`.
2. Admin gera convite para o e-mail da pessoa.
3. O app cria/reaproveita um código estável para esse e-mail.
4. Convidado cria conta ou entra com o mesmo e-mail convidado.
5. Convidado cola o código ou abre o link.
6. Ao aceitar, o app cria o vínculo em:
   - `users/{uid}/access/ninou`
   - `families/ninou-family-luizfelipe/members/{uid}`
7. O convite muda para `accepted`.
8. A pessoa passa a ver a rotina familiar.

## Passo obrigatório

Publique as regras do arquivo:

`docs/FIRESTORE_RULES_ADMIN_GLOBAL_V75_10.md`

no Firebase Console em:

`Firestore Database > Rules > Publish`
