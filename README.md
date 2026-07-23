# Ninou v84.1.1 — aplicativo universal integrado

A partir desta versão, web, iPhone e Android executam a mesma aplicação Expo/React Native Web.
Não existe mais uma interface web paralela em HTML/CSS/JavaScript legado.

## Paridade garantida

As três plataformas compartilham diretamente:

- autenticação e resolução da família ativa;
- perfil do bebê e identidade do cuidador;
- menus, opções e permissões;
- wallpapers, efeitos e temas;
- órbita, agrupamentos e registros da rotina;
- telas Hoje, Diário, Dados, Sons e Perfil;
- Firebase Authentication, Firestore e regras de segurança.

## Contrato canônico de dados

- Família ativa: `users/{uid}/access/ninou`
- Vínculos: `users/{uid}/families/{familyId}` e `families/{familyId}/members/{uid}`
- Perfil: `families/{familyId}/profile/main`
- Rotina: `families/{familyId}/days/{dayId}`

O aplicativo repara silenciosamente ponteiros antigos quando encontra mais de um vínculo, garantindo que web, iOS e Android escolham a mesma família.
Caches locais de perfil e preferências são isolados por família e nunca substituem a fonte canônica do Firestore.

## Instalação

```bash
cd mobile
npm ci
npm run typecheck
```

## Desenvolvimento

Mobile Development Build:

```bash
npm run start:dev-client -- --clear
```

Web local:

```bash
npm run web
```

## Validação completa

Na raiz:

```bash
npm test
npm run build
```

## Publicação na Vercel

- Build Command: `npm run build`
- Output Directory: `mobile/dist`
- Install Command: `npm --prefix mobile ci`

A Vercel passa a publicar o export web gerado da mesma base usada pelos aplicativos nativos.

## Firebase

Antes da publicação comercial, publique as regras desta versão:

```bash
firebase deploy --only firestore:rules
```

Use o mesmo projeto Firebase (`ninou-3c936`) em web, iOS e Android.
