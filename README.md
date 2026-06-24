# Ninou

PWA estático para registrar rotina do bebê: sono, despertares, amamentação, mamadeira e fraldas.

## Rodar localmente

```bash
python3 -m http.server 8000
```

Depois abra `http://127.0.0.1:8000`.

## Instalar no celular

Depois de publicado na Vercel, abra a URL no celular.

No iPhone:

1. Abra no Safari.
2. Toque em compartilhar.
3. Toque em `Adicionar à Tela de Início`.

No Android:

1. Abra no Chrome.
2. Toque no menu.
3. Toque em `Adicionar à tela inicial` ou `Instalar app`.

## Publicar na Vercel

Este projeto é estático: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js` e `icons/`.

Opção pela interface:

1. Suba estes arquivos para um repositório no GitHub.
2. Na Vercel, clique em `Add New...` e depois `Project`.
3. Importe o repositório.
4. Use framework `Other`.
5. Deixe `Build Command` vazio.
6. Deixe `Output Directory` vazio ou como `.`.
7. Clique em `Deploy`.

Opção pelo terminal:

```bash
npm i -g vercel
vercel --prod
```

## Observação importante

A sincronização usa Firebase Authentication e Firestore. Para dois celulares compartilharem os dados, entre com o mesmo e-mail e senha nos aparelhos.

## Firebase

No Firebase Console:

1. Em Authentication, ative o provedor `Email/Password`.
2. Em Firestore Database, use a edição Standard/Spark e publique regras compatíveis com usuários autenticados.

Regras sugeridas para esta versão:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Estrutura usada no Firestore:

```text
users/{uid}/profile/main
users/{uid}/days/{YYYY-MM-DD}
```

A foto de perfil é reduzida no navegador e salva no documento `profile/main`, então não é necessário configurar Firebase Storage nesta versão.

## Ícones

O ícone ativo usa `icons/app-icon-source.png`, gerado também como:

- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/apple-touch-icon.png`

Outras opções estão na pasta `icons/`.
