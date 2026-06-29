# Regras Firestore — Ninou v75.10

Admin global: `luizfelipe.dasilva@gmail.com`  
Família principal: `ninou-family-luizfelipe`

Copie somente o bloco abaixo e publique em **Firestore Database > Rules**.

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
      return isFamilyMember(familyId) ? get(myMemberDoc(familyId)).data.role : "";
    }

    function inviteDoc(code) {
      return /databases/$(database)/documents/invites/$(code);
    }

    function inviteExists(code) {
      return exists(inviteDoc(code));
    }

    function inviteData(code) {
      return get(inviteDoc(code)).data;
    }

    function canReadInvite(code) {
      return signedIn()
        && inviteExists(code)
        && inviteData(code).email == userEmail();
    }

    function canUsePendingInvite(code) {
      return signedIn()
        && request.resource.data.inviteCode is string
        && request.resource.data.inviteCode == code
        && inviteExists(code)
        && inviteData(code).email == userEmail()
        && inviteData(code).familyId == request.resource.data.familyId
        && inviteData(code).role == request.resource.data.role
        && inviteData(code).familyId == mainFamilyId()
        && inviteData(code).status == "pending"
        && request.resource.data.role in ["responsavel", "cuidador", "visualizacao"];
    }

    function canWriteRoutine(familyId) {
      return isAppAdmin()
        || (isFamilyMember(familyId) && myRole(familyId) in ["admin", "responsavel", "cuidador"]);
    }

    function canEditProfile(familyId) {
      return isAppAdmin()
        || (isFamilyMember(familyId) && myRole(familyId) in ["admin", "responsavel"]);
    }

    match /users/{uid}/access/{docId} {
      allow read: if signedIn() && (request.auth.uid == uid || isAppAdmin());

      allow create, update: if signedIn()
        && request.auth.uid == uid
        && isAppAdmin()
        && request.resource.data.familyId == mainFamilyId()
        && request.resource.data.role == "admin";

      allow create, update: if signedIn()
        && request.auth.uid == uid
        && canUsePendingInvite(request.resource.data.inviteCode);

      allow delete: if isAppAdmin() || (signedIn() && request.auth.uid == uid);
    }

    match /families/{familyId} {
      allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId);
      allow create, update: if isAppAdmin() && isMainFamily(familyId);
      allow delete: if false;

      match /members/{uid} {
        allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId);

        allow create, update: if isAppAdmin() && isMainFamily(familyId);

        allow create, update: if signedIn()
          && request.auth.uid == uid
          && isMainFamily(familyId)
          && canUsePendingInvite(request.resource.data.inviteCode);

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
        allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId) || canReadInvite(code);
        allow create, update, delete: if isAppAdmin() && isMainFamily(familyId);
      }

      match /{document=**} {
        allow read: if (isAppAdmin() && isMainFamily(familyId)) || isFamilyMember(familyId);
        allow write: if isAppAdmin() && isMainFamily(familyId);
      }
    }

    match /invites/{code} {
      allow get: if isAppAdmin() || canReadInvite(code);
      allow list: if isAppAdmin();

      allow create: if isAppAdmin()
        && request.resource.data.familyId == mainFamilyId()
        && request.resource.data.email is string
        && request.resource.data.role in ["responsavel", "cuidador", "visualizacao"]
        && request.resource.data.status == "pending";

      allow update: if isAppAdmin();

      allow update: if canReadInvite(code)
        && resource.data.status == "pending"
        && request.resource.data.status == "accepted"
        && request.resource.data.email == resource.data.email
        && request.resource.data.familyId == resource.data.familyId
        && request.resource.data.role == resource.data.role
        && request.resource.data.code == resource.data.code;

      allow delete: if isAppAdmin();
    }

    /* Dados individuais antigos/legados. Mantidos para não quebrar histórico antigo. */
    match /users/{userId}/profile/main {
      allow read: if signedIn() && request.auth.uid == userId;
      allow create, update: if signedIn() && request.auth.uid == userId;
      allow delete: if false;
    }

    match /users/{userId}/days/{dayId} {
      allow read: if signedIn() && request.auth.uid == userId;
      allow create, update: if signedIn() && request.auth.uid == userId;
      allow delete: if signedIn() && request.auth.uid == userId;
    }

    match /users/{userId}/{document=**} {
      allow read, write: if signedIn() && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
