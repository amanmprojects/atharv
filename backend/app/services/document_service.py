import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.storage import Bucket

from app.services.firebase_service import get_firestore_client, get_storage_bucket


class DocumentService:
    def __init__(self):
        self.db: FirestoreClient = get_firestore_client()
        self.bucket: Bucket = get_storage_bucket()
        self.collection = "documents"
        self.content_collection = "document_content"

    @staticmethod
    def _primary_content_path(doc_id: str) -> str:
        return f"documents/{doc_id}/content.json"

    async def create_document(
        self,
        title: str,
        owner_id: str,
        initial_content: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        doc_id = str(uuid.uuid4())
        now = datetime.utcnow()
        storage_path = self._primary_content_path(doc_id)

        document = {
            "id": doc_id,
            "title": title or "Untitled Document",
            "ownerId": owner_id,
            "permissions": {owner_id: 4},
            "contentHash": "",
            "storagePath": storage_path,
            "createdAt": now,
            "updatedAt": now,
            "version": 1,
            "aiConsent": False,
            "aiFeatures": [],
            "isDeleted": False,
        }

        self.db.collection(self.collection).document(doc_id).set(document)

        default_content = initial_content or {
            "type": "doc",
            "content": [{"type": "paragraph", "content": []}],
        }
        await self.save_content(doc_id, default_content)

        return document

    async def get_document(self, doc_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection(self.collection).document(doc_id)
        doc = doc_ref.get()

        if not doc.exists:
            return None

        data = doc.to_dict()

        if data.get("isDeleted"):
            return None

        user_perm = data.get("permissions", {}).get(user_id, 0)
        if user_perm < 1:
            return None

        return data

    async def list_documents(
        self, user_id: str, include_deleted: bool = False
    ) -> List[Dict[str, Any]]:
        docs = self.db.collection(self.collection).stream()

        documents = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id

            user_perm = data.get("permissions", {}).get(user_id, 0)
            if user_perm < 1:
                continue

            if not include_deleted and data.get("isDeleted"):
                continue

            documents.append(data)

        documents.sort(key=lambda x: x.get("updatedAt", datetime.min), reverse=True)
        return documents

    async def update_document(
        self, doc_id: str, user_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection(self.collection).document(doc_id)
        doc = doc_ref.get()

        if not doc.exists:
            return None

        data = doc.to_dict()
        user_perm = data.get("permissions", {}).get(user_id, 0)

        if user_perm < 3:
            return None

        updates["updatedAt"] = datetime.utcnow()
        doc_ref.update(updates)

        updated_doc = doc_ref.get()
        return updated_doc.to_dict()

    async def delete_document(self, doc_id: str, user_id: str) -> bool:
        doc_ref = self.db.collection(self.collection).document(doc_id)
        doc = doc_ref.get()

        if not doc.exists:
            return False

        data = doc.to_dict()
        user_perm = data.get("permissions", {}).get(user_id, 0)

        if user_perm < 4:
            return False

        doc_ref.update({"isDeleted": True, "deletedAt": datetime.utcnow()})

        return True

    async def save_content(self, doc_id: str, content: Dict[str, Any]) -> bool:
        try:
            content_json = json.dumps(content)
            self.bucket.blob(self._primary_content_path(doc_id)).upload_from_string(
                content_json, content_type="application/json"
            )

            doc_ref = self.db.collection(self.collection).document(doc_id)
            doc_ref.update(
                {
                    "updatedAt": datetime.utcnow(),
                    "version": 1,
                }
            )

            return True
        except Exception as e:
            print(f"Failed to save content: {e}")
            return False

    async def get_content(self, doc_id: str) -> Optional[Dict[str, Any]]:
        try:
            primary_blob = self.bucket.blob(self._primary_content_path(doc_id))

            if not primary_blob.exists():
                return {
                    "type": "doc",
                    "content": [{"type": "paragraph", "content": []}],
                }

            content = primary_blob.download_as_text()
            return json.loads(content)
        except Exception as e:
            print(f"Failed to get content: {e}")
            return None

    async def share_document(
        self, doc_id: str, owner_id: str, invitee_email: str, permission_level: int
    ) -> Optional[Dict[str, Any]]:
        doc_ref = self.db.collection(self.collection).document(doc_id)
        doc = doc_ref.get()

        if not doc.exists:
            return None

        data = doc.to_dict()
        owner_perm = data.get("permissions", {}).get(owner_id, 0)

        if owner_perm < 4:
            return None

        invitation_id = str(uuid.uuid4())
        invitation = {
            "id": invitation_id,
            "documentId": doc_id,
            "inviterId": owner_id,
            "inviteeEmail": invitee_email,
            "permissionLevel": permission_level,
            "status": "pending",
            "createdAt": datetime.utcnow(),
            "expiresAt": datetime.utcnow().replace(day=datetime.utcnow().day + 7),
        }

        self.db.collection("share_invitations").document(invitation_id).set(invitation)

        return invitation


document_service = DocumentService()
