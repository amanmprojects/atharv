resource "google_firestore_document" "security_rules" {
  project     = var.project_id
  collection  = "security_rules"
  document_id = "firestore"
  database    = "(default)"

  fields = jsonencode({
    rules = {
      stringValue = <<-EOT
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /documents/{docId} {
              function isSignedIn() {
                return request.auth != null;
              }
              
              function isOwner(doc) {
                return isSignedIn() && request.auth.uid == doc.data.ownerId;
              }
              
              function hasPermission(doc, level) {
                return isSignedIn() && doc.data.permissions[request.auth.uid] >= level;
              }
              
              function isValidPermission() {
                return request.resource.data.permissions is map &&
                       request.resource.data.permissions.values().filter(p, p < 1 || p > 4).size() == 0;
              }
              
              allow create: if isSignedIn() && 
                request.resource.data.ownerId == request.auth.uid &&
                request.resource.data.permissions[request.auth.uid] == 4;
              
              allow read: if isSignedIn() && hasPermission(resource, 1);
              
              allow update: if isSignedIn() && hasPermission(resource, 3) &&
                !request.resource.data.diff(resource.data).affectedKeys().hasAny(['ownerId']) &&
                (resource.data.permissions[request.auth.uid] >= 4 || 
                 !request.resource.data.diff(resource.data).affectedKeys().hasAny(['permissions']));
              
              allow delete: if isOwner(resource);
              
              match /comments/{commentId} {
                allow read: if hasPermission(get(/databases/$(database)/documents/documents/$(docId)), 1);
                allow create: if hasPermission(get(/databases/$(database)/documents/documents/$(docId)), 2);
                allow update: if resource.data.authorId == request.auth.uid;
                allow delete: if resource.data.authorId == request.auth.uid || 
                              isOwner(get(/databases/$(database)/documents/documents/$(docId)));
              }
            }
            
            match /users/{userId} {
              allow read: if isSignedIn();
              allow create: if isSignedIn() && request.auth.uid == userId;
              allow update: if isSignedIn() && request.auth.uid == userId;
            }
            
            match /share_invitations/{invitationId} {
              allow read: if isSignedIn() && 
                (resource.data.inviterId == request.auth.uid || 
                 resource.data.inviteeEmail == request.auth.token.email);
              allow create: if isSignedIn();
              allow update: if isSignedIn() && 
                resource.data.inviteeEmail == request.auth.token.email;
            }
            
            match /presence/{docId}/users/{userId} {
              allow read: if isSignedIn();
              allow write: if isSignedIn() && request.auth.uid == userId;
            }
            
            match /ai_requests/{requestId} {
              allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
              allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
            }
            
            match /ai_usage/{userId} {
              allow read: if isSignedIn() && userId == request.auth.uid;
              allow write: if false;
            }
            
            match /ai_features/{featureName} {
              allow read: if true;
              allow write: if false;
            }
          }
        }
      EOT
    }
  })
}
