from typing import Optional
from app.core.config import settings
import httpx
import json

class GeminiClient:
    def __init__(self):
        self.api_key = None
        self._initialized = False
    
    def initialize(self, api_key: str = None):
        if api_key or settings.GEMINI_API_KEY:
            self.api_key = api_key or settings.GEMINI_API_KEY
            self._initialized = True
    
    def is_initialized(self) -> bool:
        return self._initialized
    
    async def transform_style(
        self,
        text: str,
        style_mode: str,
        intensity: float = 0.5,
        preserve_entities: bool = True
    ) -> dict:
        if not self._initialized:
            return {
                "transformed_text": text,
                "meaning_preservation_score": 1.0,
                "llm_used": False
            }
        
        intensity_desc = {
            0.0: "very minimal",
            0.25: "slightly",
            0.5: "moderately",
            0.75: "significantly",
            1.0: "completely"
        }.get(intensity, "moderately")
        
        prompt = f"""You are a style transformation engine.

CONSTRAINTS:
- Preserve all factual content exactly
- Maintain all named entities unchanged
- Apply {style_mode} style {intensity_desc}
- Do NOT add new information
- Do NOT remove existing information

INPUT TEXT:
{text}

Transform the above text to a {style_mode} style with {intensity_desc} intensity.

OUTPUT ONLY the transformed text, nothing else."""

        try:
            transformed = await self._call_gemini(prompt)
            return {
                "transformed_text": transformed,
                "meaning_preservation_score": 0.9,
                "llm_used": True
            }
        except Exception as e:
            print(f"Gemini error: {e}")
            return {
                "transformed_text": text,
                "meaning_preservation_score": 1.0,
                "llm_used": False,
                "error": str(e)
            }
    
    async def improve_text(
        self,
        text: str,
        issue_type: str,
        reason: str
    ) -> Optional[str]:
        if not self._initialized:
            return None
        
        prompt = f"""You are a text improvement assistant.

ISSUE DETECTED: {issue_type}
REASON: {reason}

ORIGINAL TEXT:
{text}

Provide an improved version of this text that addresses the issue while preserving the meaning and all named entities.

OUTPUT ONLY the improved text, nothing else."""

        try:
            return await self._call_gemini(prompt)
        except Exception as e:
            print(f"Gemini error: {e}")
            return None
    
    async def generate_meta_description(self, text: str, max_length: int = 160) -> str:
        if not self._initialized:
            return text[:max_length]
        
        prompt = f"""Generate a SEO-friendly meta description for the following content. 
Keep it under {max_length} characters. Make it compelling and include key topics.

CONTENT:
{text[:1000]}

OUTPUT ONLY the meta description, nothing else."""

        try:
            result = await self._call_gemini(prompt)
            return result[:max_length]
        except Exception as e:
            return text[:max_length]
    
    async def _call_gemini(self, prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={self.api_key}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2048,
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            if "candidates" in data and len(data["candidates"]) > 0:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            return ""

gemini_client = GeminiClient()
