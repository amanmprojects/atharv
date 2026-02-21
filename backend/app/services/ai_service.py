import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from google.cloud.firestore import Client as FirestoreClient
from google.cloud import pubsub_v1
import os

from app.services.firebase_service import get_firestore_client


class AIService:
    def __init__(self):
        self.db: FirestoreClient = get_firestore_client()
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "")
        self.publisher = pubsub_v1.PublisherClient()
        self.topic_path = self.publisher.topic_path(
            self.project_id, "ai-document-processing"
        )

    AI_FEATURES: Dict[str, Dict[str, Any]] = {
        "summarize": {"requiresConsent": True, "costPerToken": 0.0001},
        "translate": {"requiresConsent": True, "costPerToken": 0.0001},
        "grammar-check": {"requiresConsent": True, "costPerToken": 0.00005},
        "tone-adjustment": {"requiresConsent": True, "costPerToken": 0.0001},
        "expand": {"requiresConsent": True, "costPerToken": 0.0001},
        "shorten": {"requiresConsent": True, "costPerToken": 0.0001},
        "generate-outline": {"requiresConsent": True, "costPerToken": 0.00015},
        "help-me-write": {"requiresConsent": True, "costPerToken": 0.0002},
        "improve": {"requiresConsent": True, "costPerToken": 0.0001},
    }

    async def create_request(
        self,
        user_id: str,
        document_id: str,
        feature: str,
        input_data: Dict[str, Any],
        ai_consent: bool = False,
    ) -> Optional[Dict[str, Any]]:
        feature_config = self.AI_FEATURES.get(feature)
        if not feature_config:
            return None

        if feature_config["requiresConsent"] and not ai_consent:
            return None

        usage_doc = self.db.collection("ai_usage").document(user_id).get()
        current_usage = (
            usage_doc.to_dict().get("tokensUsed", 0) if usage_doc.exists else 0
        )
        daily_limit = 100000

        if current_usage >= daily_limit:
            return None

        request_id = str(uuid.uuid4())
        ai_request = {
            "id": request_id,
            "userId": user_id,
            "documentId": document_id,
            "feature": feature,
            "status": "pending",
            "input": input_data,
            "createdAt": datetime.utcnow(),
        }

        self.db.collection("ai_requests").document(request_id).set(ai_request)

        try:
            self.publisher.publish(
                self.topic_path,
                json.dumps(
                    {
                        "requestId": request_id,
                        "feature": feature,
                        "userId": user_id,
                        "documentId": document_id,
                        "input": input_data,
                    }
                ).encode("utf-8"),
            )
        except Exception as e:
            print(f"Failed to publish to Pub/Sub: {e}")

        return ai_request

    async def get_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection("ai_requests").document(request_id).get()

        if not doc.exists:
            return None

        return doc.to_dict()

    async def get_user_requests(
        self, user_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        requests = (
            self.db.collection("ai_requests")
            .where("userId", "==", user_id)
            .order_by("createdAt", direction="DESCENDING")
            .limit(limit)
            .stream()
        )

        return [doc.to_dict() for doc in requests]

    async def update_request(
        self,
        request_id: str,
        status: str,
        output: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        tokens_used: Optional[int] = None,
    ) -> bool:
        updates: Dict[str, Any] = {"status": status, "completedAt": datetime.utcnow()}

        if output:
            updates["output"] = output
        if error:
            updates["error"] = error
        if tokens_used:
            updates["tokensUsed"] = tokens_used

        self.db.collection("ai_requests").document(request_id).update(updates)
        return True


ai_service = AIService()
