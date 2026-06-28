# Ninou v75.19 — Admin responsivo e sem tela partida

Esta versão mantém as correções da v75.18 e ajusta a tela administrativa para evitar aparência de zoom, corte lateral e quebra visual em celulares.

## Mantido da v75.18

- Migração por e-mail e UID.
- Cópia de perfil, foto, pesos e rotina para `families/ninou-family-luizfelipe`.
- Vinculação da conta migrada em `families/{familyId}/members/{uid}` e `users/{uid}/access/ninou`.
- Leitura dos dias migrados pelo calendário/último dia com dados.

## Novo na v75.19

- Admin com largura fluida e limite maior em telas grandes.
- Correção de overflow horizontal em textos longos, e-mails, UIDs e caminhos do Firestore.
- Botões, inputs e listas do admin ocupando 100% da largura disponível no mobile.
- Caminhos como `families/ninou-family-luizfelipe/profile/main` deixam de forçar zoom ou corte lateral.
- Textos de status deixam de ficar em caixa alta por herança da tela de perfil.

## Depois de publicar

Atualize o PWA ou remova/adicone novamente à tela inicial para garantir que o cache antigo saia.
