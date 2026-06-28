# Regras Firestore — Ninou v75.8

Use estas regras quando aparecer erro de permissão ao criar convite.

Admin global do app: `luizfelipe.dasilva@gmail.com`.
Família principal: `ninou-family-luizfelipe`.

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

    function isMainFamily(familyId) {
      return familyId == mainFamilyId();
    }

    function memberDoc(familyId, uid) {
      return /databases/$(database)/documents/families/$(familyId)/members/$(uid);
    }

    function myMemberDoc(familyId) {
      return memberDoc(familyId, request.auth.uid);
    }

    function isFamilyMember(familyId) {
      return signedIn() && exists(myMemberDoc(familyId));
    }

    function myRole(familyId) {
      return get(myMemberDoc(familyId)).data.role;
    }

    function inviteDoc(code) {
      return /databases/$(database)/documents/invites/$(code);
    }

    function canReadInvite(code) {
      return signedIn()
        && exists(inviteDoc(code))
        && get(inviteDoc(code)).data.email == userEmail();
    }

    function canUseInvite(code) {
      return signedIn()
        && exists(inviteDoc(code))
        && get(inviteDoc(code)).data.email == userEmail()
        && get(inviteDoc(code)).data.familyId == request.resource.data.familyId
        && get(inviteDoc(code)).data.role == request.resource.data.role
        && request.resource.data.familyId == mainFamilyId()
        && request.resource.data.role in ['responsavel', 'cuidador', 'visualizacao'];
    }

    function canWriteRoutine(familyId) {
      return isAppAdmin()
        || (isFamilyMember(familyId) && myRole(familyId) in ['admin', 'responsavel', 'cuidador']);
    }

    function canEditProfile(familyId) {
      return isAppAdmin()
        || (isFamilyMember(familyId) && myRole(familyId) in ['admin', 'responsavel']);
    }

    match /users/{uid}/access/{docId} {
      allow read: if signedIn() && (request.auth.uid == uid || isAppAdmin());

      allow create, update: if signedIn()
        && request.auth.uid == uid
        && isAppAdmin()
        && request.resource.data.familyId == mainFamilyId()
        && request.resource.data.role == 'admin';

      allow create, update: if signedIn()
        && request.auth.uid == uid
        && request.resource.data.inviteCode is string
        && canUseInvite(request.resource.data.inviteCode);

      allow delete: if isAppAdmin() || (signedIn() && request.auth.uid == uid);
    }

    match /families/{familyId} {
      allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId);
      allow create, update: if isAppAdmin() && isMainFamily(familyId);
      allow delete: if false;

      match /members/{uid} {
        allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId);

        allow create, update: if isAppAdmin()
          && isMainFamily(familyId);

        allow create, update: if signedIn()
          && request.auth.uid == uid
          && isMainFamily(familyId)
          && request.resource.data.inviteCode is string
          && canUseInvite(request.resource.data.inviteCode);

        allow delete: if isAppAdmin() && isMainFamily(familyId);
      }

      match /profile/{docId} {
        allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId);
        allow write: if isMainFamily(familyId) && canEditProfile(familyId);
      }

      match /days/{dayId} {
        allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId);
        allow write: if isMainFamily(familyId) && canWriteRoutine(familyId);
      }

      match /invites/{code} {
        allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId);
        allow create, update, delete: if isAppAdmin() && isMainFamily(familyId);
      }
    }

    match /invites/{code} {
      allow get: if isAppAdmin() || canReadInvite(code);
      allow list: if isAppAdmin();

      allow create: if isAppAdmin()
        && request.resource.data.familyId == mainFamilyId()
        && request.resource.data.email is string
        && request.resource.data.role in ['responsavel', 'cuidador', 'visualizacao'];

      allow update: if isAppAdmin();

      allow update: if canReadInvite(code)
        && request.resource.data.email == resource.data.email
        && request.resource.data.familyId == resource.data.familyId
        && request.resource.data.role == resource.data.role
        && request.resource.data.code == resource.data.code;

      allow delete: if isAppAdmin();
    }
  }
}
```

## Onde publicar

Firebase Console → Firestore Database → Rules → cole as regras → Publish.

Depois entre novamente no Ninou com `luizfelipe.dasilva@gmail.com` e gere o convite.
