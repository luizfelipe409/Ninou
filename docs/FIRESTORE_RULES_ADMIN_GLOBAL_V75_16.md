# Firestore Rules — Ninou v75.16

Cole o conteúdo abaixo em **Firebase Console > Firestore Database > Rules** e publique.

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function userEmail() {
      return isSignedIn() && request.auth.token.email != null
        ? request.auth.token.email
        : "";
    }

    function isAdmin() {
      return isSignedIn()
        && userEmail() == "luizfelipe.dasilva@gmail.com";
    }

    function isSelf(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isFamilyMember(familyId) {
      return isSignedIn()
        && exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
    }

    function memberData(familyId) {
      return get(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid)).data;
    }

    function hasLegacyAccess(familyId) {
      return isSignedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid)/access/ninou)
        && get(/databases/$(database)/documents/users/$(request.auth.uid)/access/ninou).data.familyId == familyId;
    }

    function legacyAccessData(familyId) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)/access/ninou).data;
    }

    function currentRole(familyId) {
      return isFamilyMember(familyId)
        ? memberData(familyId).role
        : (
          hasLegacyAccess(familyId)
            ? legacyAccessData(familyId).role
            : null
        );
    }

    function canReadFamily(familyId) {
      return isAdmin()
        || isFamilyMember(familyId)
        || hasLegacyAccess(familyId);
    }

    function canWriteDay(familyId) {
      return isAdmin()
        || currentRole(familyId) in ["responsavel", "responsável", "cuidador"];
    }

    function canDeleteDay(familyId) {
      return isAdmin()
        || currentRole(familyId) in ["responsavel", "responsável"];
    }

    function canEditProfile(familyId) {
      return isAdmin()
        || currentRole(familyId) in ["responsavel", "responsável"];
    }

    function inviteExists(inviteCode) {
      return exists(/databases/$(database)/documents/invites/$(inviteCode));
    }

    function inviteData(inviteCode) {
      return get(/databases/$(database)/documents/invites/$(inviteCode)).data;
    }

    function inviteBelongsToCurrentUser(inviteCode) {
      return isSignedIn()
        && inviteExists(inviteCode)
        && inviteData(inviteCode).email == userEmail();
    }

    function inviteCanJoinFamily(inviteCode, familyId) {
      return inviteBelongsToCurrentUser(inviteCode)
        && inviteData(inviteCode).familyId == familyId
        && inviteData(inviteCode).status in ["pending", "accepted"];
    }

    match /invites/{inviteCode} {
      allow read: if isAdmin()
        || (isSignedIn() && resource.data.email == userEmail());

      allow create: if isAdmin();

      allow update: if isAdmin()
        || (
          isSignedIn()
          && resource.data.email == userEmail()
          && resource.data.status in ["pending", "accepted"]
          && request.resource.data.email == resource.data.email
          && request.resource.data.familyId == resource.data.familyId
          && request.resource.data.role == resource.data.role
          && request.resource.data.status == "accepted"
        );

      allow delete: if isAdmin();
    }

    match /families/{familyId} {
      allow read: if canReadFamily(familyId);
      allow create, update: if isAdmin();
      allow delete: if isAdmin();

      match /profile/{profileId} {
        allow read: if canReadFamily(familyId);
        allow create, update: if canEditProfile(familyId);
        allow delete: if isAdmin();
      }

      match /days/{dayId} {
        allow read: if canReadFamily(familyId);
        allow create, update: if canWriteDay(familyId);
        allow delete: if canDeleteDay(familyId);
      }

      match /members/{userId} {
        allow read: if canReadFamily(familyId);

        allow create: if isAdmin()
          || (
            isSelf(userId)
            && request.resource.data.inviteCode is string
            && inviteCanJoinFamily(request.resource.data.inviteCode, familyId)
          );

        allow update: if isAdmin()
          || (
            isSelf(userId)
            && request.resource.data.role == resource.data.role
            && request.resource.data.email == resource.data.email
            && request.resource.data.inviteCode == resource.data.inviteCode
          );

        allow delete: if isAdmin();
      }

      match /invites/{inviteCode} {
        allow read: if canReadFamily(familyId)
          || (isSignedIn() && resource.data.email == userEmail());
        allow create, update, delete: if isAdmin();
      }

      match /migrations/{migrationId} {
        allow read, create, update, delete: if isAdmin();

        match /logs/{logId} {
          allow read, create, update, delete: if isAdmin();
        }
      }

      match /{document=**} {
        allow read: if canReadFamily(familyId);
        allow write: if isAdmin();
      }
    }

    match /users/{userId} {
      allow read: if isSelf(userId) || isAdmin();
      allow create, update: if isSelf(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    match /users/{userId}/profile/{profileId} {
      allow read: if isSelf(userId) || isAdmin();
      allow create, update: if isSelf(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    match /users/{userId}/days/{dayId} {
      allow read: if isSelf(userId) || isAdmin();
      allow create, update: if isSelf(userId) || isAdmin();
      allow delete: if isSelf(userId) || isAdmin();
    }

    match /users/{userId}/activities/{activityId} {
      allow read: if isSelf(userId) || isAdmin();
      allow create, update: if isSelf(userId) || isAdmin();
      allow delete: if isSelf(userId) || isAdmin();
    }

    match /users/{userId}/access/{accessId} {
      allow read: if isSelf(userId) || isAdmin();

      allow create: if isAdmin()
        || (
          isSelf(userId)
          && request.resource.data.inviteCode is string
          && inviteCanJoinFamily(
            request.resource.data.inviteCode,
            request.resource.data.familyId
          )
          && request.resource.data.email == userEmail()
          && request.resource.data.familyId == inviteData(request.resource.data.inviteCode).familyId
          && request.resource.data.role == inviteData(request.resource.data.inviteCode).role
        );

      allow update: if isAdmin()
        || (
          isSelf(userId)
          && request.resource.data.email == resource.data.email
          && request.resource.data.familyId == resource.data.familyId
          && request.resource.data.role == resource.data.role
          && request.resource.data.inviteCode == resource.data.inviteCode
        );

      allow delete: if isAdmin();
    }

    /*
      Permissões para collectionGroup usadas na busca inteligente da v75.14.
      O admin consegue encontrar subcoleções mesmo quando users/{uid} é um documento
      raiz vazio/fantasma no Firestore Console.
    */
    match /{path=**}/activities/{activityId} {
      allow read: if isAdmin();
    }

    match /{path=**}/days/{dayId} {
      allow read: if isAdmin();
    }

    match /{path=**}/profile/{profileId} {
      allow read: if isAdmin();
    }

    match /{path=**}/access/{accessId} {
      allow read: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
