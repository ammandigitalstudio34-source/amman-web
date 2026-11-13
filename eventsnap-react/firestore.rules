rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn() && request.auth.uid == "QXpWsJiQE9N0e4lb12J2oFqUfyk2";
    }

    function hasVerifiedProfile(uid) {
      return exists(/databases/$(database)/documents/profiles/$(uid))
        && get(/databases/$(database)/documents/profiles/$(uid)).data.verified == true;
    }

    match /profiles/{profileId} {
      allow read: if true;
      allow create: if signedIn()
        && request.auth.uid == profileId
        && request.resource.data.ownerUid == request.auth.uid
        && request.resource.data.id == profileId
        && request.resource.data.verified == false;
      allow update: if isAdmin()
        || (signedIn()
          && request.auth.uid == profileId
          && request.resource.data.ownerUid == resource.data.ownerUid
          && request.resource.data.id == resource.data.id
          && request.resource.data.verified == resource.data.verified);
      allow delete: if isAdmin() || (signedIn() && request.auth.uid == profileId);
    }

    match /gigs/{gigId} {
      allow read: if true;
      allow create: if signedIn()
        && request.resource.data.ownerUid == request.auth.uid
        && request.resource.data.status == "open"
        && !request.resource.data.keys().hasAny(["phone", "notes"]);
      allow update: if isAdmin()
        || (signedIn()
          && resource.data.status == "open"
          && request.resource.data.status == "confirmed"
          && request.resource.data.ownerUid == resource.data.ownerUid
          && request.resource.data.photographerUid == request.auth.uid
          && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(["status", "photographer", "photographerUid", "confirmedAt"])
          && hasVerifiedProfile(request.auth.uid)
          && request.resource.data.photographer
            == get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.name);
      allow delete: if isAdmin() || (signedIn() && request.auth.uid == resource.data.ownerUid);
    }

    match /gigPrivate/{gigId} {
      allow read: if isAdmin()
        || (signedIn() && request.auth.uid == resource.data.ownerUid)
        || (signedIn()
          && get(/databases/$(database)/documents/gigs/$(gigId)).data.status == "confirmed"
          && get(/databases/$(database)/documents/gigs/$(gigId)).data.photographerUid == request.auth.uid);
      allow create: if signedIn()
        && request.resource.data.ownerUid == request.auth.uid
        && getAfter(/databases/$(database)/documents/gigs/$(gigId)).data.ownerUid == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if isAdmin() || (signedIn() && request.auth.uid == resource.data.ownerUid);
    }

    match /conversations/{conversationId} {
      allow read: if isAdmin()
        || (signedIn() && request.auth.uid in resource.data.participants);
      allow create: if signedIn()
        && request.resource.data.customerUid == request.auth.uid
        && request.resource.data.photographerUid != request.auth.uid
        && request.resource.data.participants.hasAll([
          request.resource.data.customerUid,
          request.resource.data.photographerUid
        ])
        && exists(/databases/$(database)/documents/profiles/$(request.resource.data.photographerUid));
      allow update: if isAdmin()
        || (signedIn()
          && request.auth.uid in resource.data.participants
          && request.resource.data.customerUid == resource.data.customerUid
          && request.resource.data.photographerUid == resource.data.photographerUid
          && request.resource.data.profileId == resource.data.profileId
          && request.resource.data.participants == resource.data.participants
          && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(["lastMessageText", "lastMessageAt", "lastSenderRole", "updatedAt"]));
      allow delete: if isAdmin();

      match /messages/{messageId} {
        function parentConversation() {
          return get(/databases/$(database)/documents/conversations/$(conversationId)).data;
        }

        function validMessage() {
          return request.resource.data.keys().hasOnly(["senderUid", "senderRole", "text", "t"])
            && request.resource.data.text is string
            && request.resource.data.text.size() > 0
            && request.resource.data.text.size() <= 500
            && request.resource.data.t is int;
        }

        allow read: if isAdmin()
          || (signedIn() && request.auth.uid in parentConversation().participants);
        allow create: if validMessage()
          && ((isAdmin()
            && request.resource.data.senderUid == request.auth.uid
            && request.resource.data.senderRole == "admin")
          || (signedIn()
            && request.resource.data.senderUid == request.auth.uid
            && ((request.resource.data.senderRole == "customer"
                && request.auth.uid == parentConversation().customerUid)
              || (request.resource.data.senderRole == "photographer"
                && request.auth.uid == parentConversation().photographerUid
                && hasVerifiedProfile(request.auth.uid)))));
        allow update, delete: if isAdmin();
      }
    }
  }
}
