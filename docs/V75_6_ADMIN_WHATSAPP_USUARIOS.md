# Ninou v75.6 — Admin, WhatsApp e contagem de usuários

Esta versão consolida o modelo de acesso por convite e adiciona dois pontos importantes para o uso real do Ninou:

1. Contato rápido com o administrador quando a pessoa ainda não tem acesso.
2. Visão do admin com quantidade de usuários autorizados e convites.

## Admin global

O administrador global do app é:

```txt
luizfelipe.dasilva@gmail.com
```

Somente essa conta vê o painel de administração.

## WhatsApp para novos interessados

Quando o visitante abre o site sem estar vinculado a uma família/autorização, aparece um botão pequeno de WhatsApp com a mensagem pronta:

```txt
Olá! Tenho interesse em acessar o Ninou. Pode me enviar um convite?
```

Número configurado:

```txt
+55 21 98190-4591
```

O botão fica oculto para o admin e para usuários já autorizados.

## Contagem no painel Admin

No painel Admin foi adicionada a seção **Visão do Admin**, que mostra:

- Usuários vinculados à família principal.
- Convites pendentes.
- Convites aceitos.

A contagem de usuários considera os documentos em:

```txt
families/ninou-family-luizfelipe/members
```

Ou seja, ela mostra usuários autorizados/vinculados ao Ninou. Contas criadas no Firebase Authentication, mas que ainda não aceitaram convite, não entram nessa contagem.

## Observação importante

Para listar todos os usuários existentes no Firebase Authentication, incluindo contas criadas sem convite, é necessário usar uma camada segura de backend/Cloud Functions com Firebase Admin SDK. O frontend do Ninou não deve listar usuários diretamente do Authentication.

## Arquivos atualizados

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `css/app.legacy.css`
- `js/app.legacy.js`
