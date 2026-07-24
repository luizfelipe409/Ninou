# Firestore Rules v84.1.2

As regras estão preparadas em `firestore.rules`, mas não foram publicadas.

## O que está protegido

- `families/{familyId}/members/{uid}` é a única fonte de autorização familiar.
- Índices pessoais não concedem acesso a uma família.
- A primeira família é criada em um lote atômico vinculado ao próprio UID.
- Convites preservam e-mail, família e papel definidos pelo gestor.
- `owner`, `admin_familiar` e `cuidador` podem gravar rotina.
- `visualizacao` possui somente leitura.
- Escritas de rotina validam família, data, autor e timestamps.
- Plano e assinatura só podem ser alterados pelo administrador global.
- A assinatura ainda não bloqueia o uso nesta etapa de lançamento.

## Validação local

```bash
cd "/Users/luizf/Documents/Projeto Baby"
npm test
```

O teste de regras usa um projeto `demo-*` isolado e nunca acessa a produção.

## Publicação futura

Antes de publicar, salve uma cópia da versão ativa no console do Firebase.

```bash
cd "/Users/luizf/Documents/Projeto Baby"
npx --yes firebase-tools@15.2.1 deploy \
  --only firestore:rules \
  --project ninou-3c936
```

Depois da publicação, faça um teste rápido com quatro contas:

1. Nova conta criando sua própria família.
2. Responsável criando e aceitando um convite.
3. Cuidador registrando e corrigindo uma rotina.
4. Visualizador lendo os dados e recebendo bloqueio ao tentar gravar.

Em caso de comportamento inesperado, restaure a versão anterior pelo histórico
de versões das regras no console do Firebase.
