import os
from functools import lru_cache
from typing import Optional

import firebase_admin
from firebase_admin import firestore, storage, auth
from google.cloud.firestore import Client as FirestoreClient
from google.cloud.storage import Bucket

from app.core.config import settings


@lru_cache()
def get_project_id() -> str:
    return settings.GOOGLE_CLOUD_PROJECT or os.getenv("GOOGLE_CLOUD_PROJECT", "")


@lru_cache()
def get_firebase_app() -> firebase_admin.App:
    if firebase_admin._apps:
        return list(firebase_admin._apps.values())[0]

    project_id = get_project_id()
    storage_bucket = settings.FIREBASE_STORAGE_BUCKET or os.getenv(
        "FIREBASE_STORAGE_BUCKET", f"{project_id}.appspot.com"
    )

    # Firebase Admin SDK will automatically use ADC (Application Default Credentials)
    # when no explicit credentials are provided. This works with:
    # - gcloud auth application-default login (local dev)
    # - Service accounts on GCP (Cloud Run, Cloud Functions, etc.)
    return firebase_admin.initialize_app(
        options={
            "projectId": project_id,
            "storageBucket": storage_bucket,
        }
    )


@lru_cache()
def get_firestore_client() -> FirestoreClient:
    app = get_firebase_app()
    return firestore.client(app)


@lru_cache()
def get_storage_bucket() -> Optional[Bucket]:
    project_id = get_project_id()
    if not project_id:
        print(
            "Warning: GOOGLE_CLOUD_PROJECT not set. Storage features will be disabled."
        )
        return None

    app = get_firebase_app()
    bucket_name = settings.FIREBASE_STORAGE_BUCKET or os.getenv(
        "FIREBASE_STORAGE_BUCKET", f"{project_id}.appspot.com"
    )
    try:
        return storage.bucket(bucket_name, app=app)
    except ValueError as e:
        print(f"Failed to initialize storage bucket '{bucket_name}': {e}")
        return None


def verify_id_token(id_token: str) -> Optional[dict]:
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None


def get_user_by_uid(uid: str) -> Optional[auth.UserRecord]:
    try:
        return auth.get_user(uid)
    except Exception as e:
        print(f"Failed to get user: {e}")
        return None
