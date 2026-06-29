rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function userEmail() {
      return request.auth.token.email;
    }

    function isAdmin() {
      return isSignedIn()
        && request.auth.token.email == "luizfelipe.dasilva@gmail.com";
    }

    function isSelf(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function memberPath(familyId) {
      return /databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid);
    }

    function legacyAccessPath() {
      return /databases/$(database)/documents/users/$(request.auth.uid)/access/ninou;
    }

    function isFamilyMember(familyId) {
      return isSignedIn()
        && exists(memberPath(familyId));
    }

    function hasLegacyAccess(familyId) {
      return isSignedIn()
        && exists(legacyAccessPath())
        && get(legacyAccessPath()).data.familyId == familyId;
    }

    function memberRoleIs(familyId, roles) {
      return isFamilyMember(familyId)
        && get(memberPath(familyId)).data.role in roles;
    }

    function legacyRoleIs(familyId, roles) {
      return hasLegacyAccess(familyId)
        && get(legacyAccessPath()).data.role in roles;
    }

    function canReadFamily(familyId) {
      return isAdmin()
        || isFamilyMember(familyId)
        || hasLegacyAccess(familyId);
    }

    function canWriteDay(familyId) {
      return isAdmin()
        || memberRoleIs(familyId, ["responsavel", "responsável", "cuidador"])
        || legacyRoleIs(familyId, ["responsavel", "responsável", "cuidador"]);
    }

    function canDeleteDay(familyId) {
      return isAdmin()
        || memberRoleIs(familyId, ["responsavel", "responsável"])
        || legacyRoleIs(familyId, ["responsavel", "responsável"]);
    }

    function canEditProfile(familyId) {
      return isAdmin()
        || memberRoleIs(familyId, ["responsavel", "responsável"])
        || legacyRoleIs(familyId, ["responsavel", "responsável"]);
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

    match /users/{userId}/account/{profileId} {
      allow read: if isSelf(userId) || isAdmin();
      allow create, update: if isSelf(userId) || isAdmin();
      allow delete: if isSelf(userId) || isAdmin();
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

    match /users/{userId}/weights/{weightId} {
      allow read: if isSelf(userId) || isAdmin();
      allow create, update: if isSelf(userId) || isAdmin();
      allow delete: if isSelf(userId) || isAdmin();
    }

    match /users/{userId}/pesos/{weightId} {
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

    match /{path=**}/account/{profileId} {
      allow read: if isAdmin();
    }

    match /{path=**}/weights/{weightId} {
      allow read: if isAdmin();
    }

    match /{path=**}/pesos/{weightId} {
      allow read: if isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
