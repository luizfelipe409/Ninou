# Regras sugeridas para Firestore — Ninou v75.4

> Ajuste e teste no console do Firebase antes de publicar em produção.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
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

    function canWrite(familyId) {
      return isFamilyMember(familyId) && role(familyId) in ['admin', 'responsavel', 'cuidador'];
    }

    function canAdmin(familyId) {
      return isFamilyMember(familyId) && role(familyId) == 'admin';
    }

    match /users/{uid}/access/{docId} {
      allow read, write: if signedIn() && request.auth.uid == uid;
    }

    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow create: if signedIn() && familyId == request.auth.uid;
      allow update: if canAdmin(familyId);

      match /members/{uid} {
        allow read: if isFamilyMember(familyId);
        allow create: if signedIn() && (request.auth.uid == uid || canAdmin(familyId));
        allow update, delete: if canAdmin(familyId);
      }

      match /profile/{docId} {
        allow read: if isFamilyMember(familyId);
        allow write: if isFamilyMember(familyId) && role(familyId) in ['admin', 'responsavel'];
      }

      match /days/{dayId} {
        allow read: if isFamilyMember(familyId);
        allow write: if canWrite(familyId);
      }

      match /invites/{code} {
        allow read, write: if canAdmin(familyId);
      }
    }

    match /invites/{code} {
      allow get: if signedIn();
      allow create: if signedIn() && request.resource.data.createdBy == request.auth.uid;
      allow update: if signedIn();
    }
  }
}
```

## Observação

Para um controle ainda mais forte de criação de usuários, o ideal é usar Cloud Functions/Admin SDK. A v75.4 evita criar senhas de terceiros no frontend e usa convite por código/link.
