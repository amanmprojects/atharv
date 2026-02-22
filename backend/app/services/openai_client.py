from typing import Optional

from openai import AsyncOpenAI

from app.core.config import settings


class OpenAIClient:
    def __init__(self):
        self.api_key: Optional[str] = None
        self.base_url: Optional[str] = None
        self.model: str = settings.OPENAI_MODEL
        self._initialized = False
        self._client: Optional[AsyncOpenAI] = None

    def initialize(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ):
        key = api_key or settings.OPENAI_API_KEY
        if not key:
            return

        self.api_key = key
        self.base_url = (base_url or settings.OPENAI_BASE_URL).strip() or None
        self.model = model or settings.OPENAI_MODEL

        client_kwargs = {"api_key": self.api_key}
        if self.base_url:
            client_kwargs["base_url"] = self.base_url

        self._client = AsyncOpenAI(**client_kwargs)
        self._initialized = True

    def is_initialized(self) -> bool:
        return self._initialized

    async def transform_style(
        self,
        text: str,
        style_mode: str,
        intensity: float = 0.5,
        preserve_entities: bool = True,
    ) -> dict:
        if not self._initialized:
            return {
                "transformed_text": text,
                "meaning_preservation_score": 1.0,
                "llm_used": False,
            }

        intensity_desc = {
            0.0: "very minimal",
            0.25: "slightly",
            0.5: "moderately",
            0.75: "significantly",
            1.0: "completely",
        }.get(intensity, "moderately")

        prompt = f"""You are a style transformation engine.

CONSTRAINTS:
- Preserve all factual content exactly
- Maintain all named entities unchanged: {preserve_entities}
- Apply {style_mode} style {intensity_desc}
- Do NOT add new information
- Do NOT remove existing information

INPUT TEXT:
{text}

Transform the above text to a {style_mode} style with {intensity_desc} intensity.

OUTPUT ONLY the transformed text, nothing else."""

        try:
            transformed = await self._call_openai(prompt)
            return {
                "transformed_text": transformed or text,
                "meaning_preservation_score": 0.9,
                "llm_used": True,
            }
        except Exception as e:
            print(f"OpenAI error: {e}")
            return {
                "transformed_text": text,
                "meaning_preservation_score": 1.0,
                "llm_used": False,
                "error": str(e),
            }

    async def improve_text(
        self,
        text: str,
        issue_type: str,
        reason: str,
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
            return await self._call_openai(prompt)
        except Exception as e:
            print(f"OpenAI error: {e}")
            return None

    async def generate_meta_description(
        self, text: str, max_length: int = 160
    ) -> str:
        if not self._initialized:
            return text[:max_length]

        prompt = f"""Generate a SEO-friendly meta description for the following content.
Keep it under {max_length} characters. Make it compelling and include key topics.

CONTENT:
{text[:1000]}

OUTPUT ONLY the meta description, nothing else."""

        try:
            result = await self._call_openai(prompt)
            return (result or text)[:max_length]
        except Exception:
            return text[:max_length]

    async def _call_openai(self, prompt: str) -> str:
        if self._client is None:
            raise RuntimeError("OpenAI client is not initialized.")

        completion = await self._client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Follow instructions exactly and return plain text only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2048,
        )

        content = completion.choices[0].message.content
        return (content or "").strip()


openai_client = OpenAIClient()
