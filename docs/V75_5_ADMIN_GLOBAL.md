# Ninou v75.5 — Admin global por convite

## Objetivo

Ajustar o modelo de administração para que apenas uma conta seja dona do app e tenha acesso ao painel de administração.

Admin global:

```txt
luizfelipe.dasilva@gmail.com
```

## Comportamento esperado

### Admin do app

Ao entrar com o e-mail admin:

- o app reconhece a conta como Admin do App;
- a família principal é ativada automaticamente, se ainda não existir;
- o painel de convites aparece no Perfil;
- o admin pode convidar usuários por e-mail;
- o admin define a permissão do convidado.

### Usuário convidado

Ao entrar com outro e-mail:

- o painel Admin não aparece;
- se não houver convite aceito, as funções principais ficam bloqueadas;
- o usuário pode aceitar um convite recebido;
- após aceitar, acessa a rotina familiar conforme a permissão definida.

## Permissões disponíveis

- **Responsável**: registra, edita e exclui.
- **Cuidador**: registra e acompanha, sem ações sensíveis.
- **Visualização**: apenas acompanha.

A opção de convidar outro administrador foi removida da interface para manter o painel exclusivo do dono do app.

## Estrutura no Firestore

```txt
families/ninou-family-luizfelipe
families/ninou-family-luizfelipe/profile/main
families/ninou-family-luizfelipe/days/{data}
families/ninou-family-luizfelipe/members/{uid}
families/ninou-family-luizfelipe/invites/{codigo}
users/{uid}/access/ninou
invites/{codigo}
```

## Observação de segurança

Esconder o painel Admin no frontend melhora a experiência, mas a proteção real precisa estar nas regras do Firebase. Use o arquivo de regras sugeridas como base e teste no simulador do Firebase antes de publicar.
