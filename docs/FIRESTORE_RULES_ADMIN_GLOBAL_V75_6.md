# Regras sugeridas para Firestore — Ninou v75.6 Admin global

> Ajuste e teste no console do Firebase antes de publicar em produção.
> O e-mail admin do app é `luizfelipe.dasilva@gmail.com`.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function userEmail() {
      return signedIn() && request.auth.token.email != null
        ? request.auth.token.email
        : "";
    }

    function isAppAdmin() {
      return signedIn() && userEmail() == "luizfelipe.dasilva@gmail.com";
    }

    function mainFamilyId() {
      return "ninou-family-luizfelipe";
    }

    function memberDoc(familyId) {
      return /databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid);
    }

    function isFamilyMember(familyId) {
      return signedIn() && exists(memberDoc(familyId));
    }

    function role(familyId) {
      return get(memberDoc(familyId)).data.role;
    }

    function canWriteRoutine(familyId) {
      return isFamilyMember(familyId) && role(familyId) in ['admin', 'responsavel', 'cuidador'];
    }

    function canEditProfile(familyId) {
      return isFamilyMember(familyId) && role(familyId) in ['admin', 'responsavel'];
    }

    function canReadInvite(code) {
      return signedIn()
        && exists(/databases/$(database)/documents/invites/$(code))
        && get(/databases/$(database)/documents/invites/$(code)).data.email == userEmail();
    }

    match /users/{uid}/access/{docId} {
      allow read: if signedIn() && request.auth.uid == uid;
      allow create, update: if signedIn()
        && request.auth.uid == uid
        && request.resource.data.role in ['responsavel', 'cuidador', 'visualizacao']
        && request.resource.data.familyId == mainFamilyId();
      allow create, update: if isAppAdmin()
        && request.auth.uid == uid
        && request.resource.data.role == 'admin'
        && request.resource.data.familyId == mainFamilyId();
    }

    match /families/{familyId} {
      allow read: if isFamilyMember(familyId) || (isAppAdmin() && familyId == mainFamilyId());
      allow create, update: if isAppAdmin() && familyId == mainFamilyId();

      match /members/{uid} {
        allow read: if isFamilyMember(familyId) || (isAppAdmin() && familyId == mainFamilyId());
        allow create: if signedIn()
          && familyId == mainFamilyId()
          && request.auth.uid == uid
          && request.resource.data.role in ['admin', 'responsavel', 'cuidador', 'visualizacao'];
        allow update, delete: if isAppAdmin() && familyId == mainFamilyId();
      }

      match /profile/{docId} {
        allow read: if isFamilyMember(familyId);
        allow write: if canEditProfile(familyId);
      }

      match /days/{dayId} {
        allow read: if isFamilyMember(familyId);
        allow write: if canWriteRoutine(familyId);
      }

      match /invites/{code} {
        allow read, create, update, delete: if isAppAdmin() && familyId == mainFamilyId();
      }
    }

    match /invites/{code} {
      allow get: if isAppAdmin() || canReadInvite(code);
      allow create: if isAppAdmin()
        && request.resource.data.familyId == mainFamilyId()
        && request.resource.data.email is string
        && request.resource.data.role in ['responsavel', 'cuidador', 'visualizacao'];
      allow update: if isAppAdmin() || canReadInvite(code);
    }
  }
}
```

## Recomendação de produção

Para um controle mais forte de expiração, cancelamento e auditoria de convites, o ideal é usar Cloud Functions/Admin SDK. Esta versão já evita criar senhas de terceiros no frontend e deixa o fluxo baseado em convite.

## Contagem de usuários no painel Admin

A tela Admin v75.6 lê:

```txt
families/{familyId}/members
families/{familyId}/invites
```

As regras acima já permitem leitura dessas coleções para o admin do app. Se a contagem aparecer como erro, revise se as regras publicadas no Firebase são as desta versão.
