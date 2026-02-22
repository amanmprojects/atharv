from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx
from google.auth.transport.requests import Request as GoogleAuthRequest
import google.auth

from app.core.config import settings


class CloudLanguageClient:
    """Lightweight client for Google Cloud Natural Language REST v2."""

    def __init__(self) -> None:
        self.api_key: str = ""
        self.credentials = None
        self._initialized = False
        self.base_url = "https://language.googleapis.com/v2"

    def initialize(self, api_key: Optional[str] = None) -> None:
        # Prefer ADC auth (service account / workload identity / gcloud auth app-default).
        try:
            credentials, _ = google.auth.default(
                scopes=["https://www.googleapis.com/auth/cloud-language"]
            )
            self.credentials = credentials
            self._initialized = True
            return
        except Exception:
            self.credentials = None

        # Fallback for local/manual usage if ADC is unavailable.
        configured_key = api_key or settings.GOOGLE_NL_API_KEY
        if configured_key:
            self.api_key = configured_key
            self._initialized = True

    def is_initialized(self) -> bool:
        return self._initialized

    async def analyze_entities(self, text: str) -> List[Dict[str, Any]]:
        if not self._initialized or not text.strip():
            return []

        payload = {
            "document": {
                "type": "PLAIN_TEXT",
                "content": text,
            }
        }

        data = await self._post("/documents:analyzeEntities", payload)
        if not data:
            return []
        return data.get("entities", [])

    async def analyze_sentiment(self, text: str) -> Optional[Dict[str, Any]]:
        if not self._initialized or not text.strip():
            return None

        payload = {
            "document": {
                "type": "PLAIN_TEXT",
                "content": text,
            }
        }

        data = await self._post("/documents:analyzeSentiment", payload)
        if not data:
            return None
        return data

    async def _post(
        self, path: str, payload: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}{path}"
        params: Dict[str, str] = {}
        headers = {"Content-Type": "application/json"}

        try:
            access_token = self._get_access_token()
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
            elif self.api_key:
                params["key"] = self.api_key

            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    url, params=params, json=payload, headers=headers
                )
                response.raise_for_status()
                return response.json()
        except Exception:
            # Natural Language enrichments are optional and should never
            # break local analysis.
            return None

    def _get_access_token(self) -> Optional[str]:
        if self.credentials is None:
            return None

        if (not self.credentials.valid) or self.credentials.expired or (
            not self.credentials.token
        ):
            self.credentials.refresh(GoogleAuthRequest())

        return self.credentials.token


cloud_language_client = CloudLanguageClient()
