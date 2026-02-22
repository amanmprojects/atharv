"""
Scene prompt builder + image generation (mock/stability/dalle).
"""

from __future__ import annotations

import base64
import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List


LOCATION_WORDS = {
    "room", "forest", "street", "alley", "office", "house", "apartment", "bridge", "station", "school",
    "court", "hospital", "market", "harbor", "hallway", "kitchen", "library", "rooftop", "desert", "mountain",
}
COLOR_WORDS = {
    "red", "blue", "green", "gold", "silver", "black", "white", "purple", "amber", "scarlet", "crimson",
    "cyan", "orange", "pink", "gray", "grey", "teal", "indigo",
}
STRONG_VERBS = {
    "run", "rush", "slam", "grab", "chase", "fight", "stare", "whisper", "shout", "smash", "burst", "freeze",
    "crawl", "glare", "march", "dodge", "lunge", "climb", "fall", "spin", "charge",
}


GENRE_STYLE_MAP = {
    "thriller": "cinematic noir, high contrast shadows, dramatic lighting",
    "romance": "soft golden hour lighting, warm tones, shallow depth of field",
    "fantasy": "epic painterly, magical atmosphere, volumetric light",
    "horror": "dark desaturated, eerie fog, deep shadows, ominous",
    "mystery": "moody blue tones, film grain, detective aesthetic",
    "comedy": "bright saturated colors, dynamic poses, expressive",
    "literary": "artistic, muted palette, thoughtful composition",
    "journalistic": "documentary style, neutral tones, realistic",
}

ART_STYLE_MAP = {
    "photorealistic": "photorealistic, 8K, hyperdetailed, cinematic photograph",
    "illustrated": "illustrated novel style, detailed ink linework, book cover art",
    "watercolor": "watercolor painting, soft washes, artistic, expressive",
    "comic": "comic book style, bold outlines, cel shading, dynamic panels",
    "concept_art": "concept art, digital painting, ArtStation, professional",
}

AVAILABLE_IMAGE_STYLES = [
    {"id": "photorealistic", "label": "Photorealistic"},
    {"id": "illustrated", "label": "Illustrated"},
    {"id": "watercolor", "label": "Watercolour"},
    {"id": "comic", "label": "Comic"},
    {"id": "concept_art", "label": "Concept Art"},
]


class ScenePromptBuilder:
    def build_prompt(
        self,
        paragraph: str,
        para_index: int,
        char_result: Dict[str, Any],
        pacing_data: List[Dict[str, Any]],
        genre: str,
        art_style: str,
    ) -> Dict[str, Any]:
        visual_sentence = self._extract_visual_sentence(paragraph, char_result)
        char_desc = self._build_character_desc(paragraph, para_index, char_result)
        pacing_score = self._pacing_score_for_paragraph(para_index, pacing_data)
        mood_desc = self._mood_from_pacing(pacing_score)

        genre_style = GENRE_STYLE_MAP.get(str(genre or "").lower(), "cinematic storytelling composition")
        art_style_text = ART_STYLE_MAP.get(str(art_style or "illustrated").lower(), ART_STYLE_MAP["illustrated"])

        full_prompt = f"{visual_sentence}, {char_desc}, {mood_desc}, {genre_style}, {art_style_text}"
        negative_prompt = "blurry, low quality, deformed, watermark, text, logo, ugly, bad anatomy"

        return {
            "paragraph_index": para_index,
            "text_preview": paragraph[:80],
            "visual_sentence": visual_sentence,
            "char_desc": char_desc,
            "mood_desc": mood_desc,
            "genre_style": genre_style,
            "art_style": art_style_text,
            "full_prompt": full_prompt,
            "negative_prompt": negative_prompt,
            "pacing_score": pacing_score,
        }

    def _extract_visual_sentence(self, paragraph: str, char_result: Dict[str, Any]) -> str:
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", paragraph.strip()) if s.strip()]
        if not sentences:
            return paragraph.strip()

        names = set((char_result or {}).get("characters", {}).keys())

        def score(sentence: str) -> float:
            tokens = re.findall(r"\b[a-zA-Z']+\b", sentence.lower())
            token_set = set(tokens)
            location_score = sum(2.0 for token in token_set if token in LOCATION_WORDS)
            color_score = sum(1.5 for token in token_set if token in COLOR_WORDS)
            action_score = sum(1.0 for token in token_set if token in STRONG_VERBS)
            character_score = 0.0
            for name in names:
                if name.lower() in sentence.lower():
                    character_score += 1.0
            return location_score + color_score + action_score + character_score

        ranked = sorted(sentences, key=score, reverse=True)
        return ranked[0]

    def _build_character_desc(self, paragraph: str, para_index: int, char_result: Dict[str, Any]) -> str:
        characters_map = (char_result or {}).get("characters", {})
        paragraphs = (char_result or {}).get("paragraphs", [])
        paragraph_lower = paragraph.lower()

        mentioned = [name for name in characters_map.keys() if name.lower() in paragraph_lower]
        if not mentioned:
            return "No visible character foregrounded, focus on environment and mood"

        history_text = "\n".join(paragraphs[: max(0, para_index - 1)]) if isinstance(paragraphs, list) else ""
        parts = []

        for name in mentioned[:3]:
            desc = self._extract_description_for_name(name, history_text)
            if not desc:
                desc = self._default_desc_for_name(name, len(characters_map.get(name, [])), len(paragraphs) or 1)
            parts.append(f"{name}: {desc}")

        return "; ".join(parts)

    def _extract_description_for_name(self, name: str, history_text: str) -> str:
        if not history_text:
            return ""
        patterns = [
            rf"{re.escape(name)}\s+(?:was|is|had|wore)\s+([^.,;!?:]{{3,80}})",
            rf"{re.escape(name)}\s*,\s*a[n]?\s+([^.,;!?:]{{3,80}})",
        ]
        for pattern in patterns:
            match = re.search(pattern, history_text, flags=re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return ""

    def _default_desc_for_name(self, name: str, appearances: int, total_paragraphs: int) -> str:
        ratio = appearances / max(total_paragraphs, 1)
        if ratio >= 0.6:
            return "central character, expressive face, detailed outfit"
        if ratio >= 0.2:
            return "supporting character, readable silhouette"
        return "background character, minimal detail"

    def _pacing_score_for_paragraph(self, para_index: int, pacing_data: List[Dict[str, Any]]) -> float:
        for row in pacing_data or []:
            if int(row.get("paragraph", 0)) == para_index:
                return float(row.get("pacing_score", 0.0))
        return 0.0

    def _mood_from_pacing(self, pacing_score: float) -> str:
        if pacing_score >= 7:
            return "tense, high energy, dynamic composition, Dutch angle camera"
        if pacing_score >= 4:
            return "moderate tension, balanced composition, eye-level"
        return "calm, contemplative, wide shot, peaceful"


class ImageGenerator:
    def __init__(self) -> None:
        self.builder = ScenePromptBuilder()

    def generate(self, prompt_data: Dict[str, Any], mode: str = "mock") -> Dict[str, Any]:
        mode = (mode or "mock").lower()
        if mode == "mock":
            return {
                **prompt_data,
                "image_url": None,
                "status": "mock",
                "sd_prompt_summary": self._stable_diffusion_summary(prompt_data),
            }

        if mode == "stability":
            try:
                image_data_uri = self._generate_stability(prompt_data)
                return {
                    **prompt_data,
                    "image_url": image_data_uri,
                    "status": "generated",
                    "sd_prompt_summary": self._stable_diffusion_summary(prompt_data),
                }
            except Exception as exc:  # noqa: BLE001
                return {
                    **prompt_data,
                    "image_url": None,
                    "status": "mock",
                    "error": str(exc),
                    "sd_prompt_summary": self._stable_diffusion_summary(prompt_data),
                }

        if mode == "dalle":
            try:
                image_url = self._generate_dalle(prompt_data)
                return {
                    **prompt_data,
                    "image_url": image_url,
                    "status": "generated",
                    "sd_prompt_summary": self._stable_diffusion_summary(prompt_data),
                }
            except Exception as exc:  # noqa: BLE001
                return {
                    **prompt_data,
                    "image_url": None,
                    "status": "mock",
                    "error": str(exc),
                    "sd_prompt_summary": self._stable_diffusion_summary(prompt_data),
                }

        return {
            **prompt_data,
            "image_url": None,
            "status": "mock",
            "sd_prompt_summary": self._stable_diffusion_summary(prompt_data),
        }

    def generate_all(
        self,
        text: str,
        char_result: Dict[str, Any],
        pacing_res: Dict[str, Any],
        genre: str,
        art_style: str,
        mode: str = "mock",
    ) -> List[Dict[str, Any]]:
        paragraphs = [p.strip() for p in (text or "").split("\n\n") if p.strip()]
        pacing_rows = pacing_res.get("pacing", []) if isinstance(pacing_res, dict) else (pacing_res or [])

        results = []
        for idx, paragraph in enumerate(paragraphs, start=1):
            word_count = len(re.findall(r"\b\w+\b", paragraph))
            if word_count < 20:
                continue
            prompt_data = self.builder.build_prompt(paragraph, idx, char_result, pacing_rows, genre, art_style)
            results.append(self.generate(prompt_data, mode=mode))
        return results

    def _stable_diffusion_summary(self, prompt_data: Dict[str, Any]) -> str:
        return (
            f"PROMPT: {prompt_data.get('full_prompt', '')}\n"
            f"NEGATIVE: {prompt_data.get('negative_prompt', '')}\n"
            "CFG: 7 | STEPS: 30 | SIZE: 768x512"
        )

    def _generate_stability(self, prompt_data: Dict[str, Any]) -> str:
        api_key = os.getenv("STABILITY_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("STABILITY_API_KEY not set")

        payload = {
            "text_prompts": [
                {"text": prompt_data["full_prompt"], "weight": 1},
                {"text": prompt_data["negative_prompt"], "weight": -1},
            ],
            "cfg_scale": 7,
            "height": 512,
            "width": 768,
            "steps": 30,
            "samples": 1,
        }

        req = urllib.request.Request(
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore") if hasattr(exc, "read") else str(exc)
            raise RuntimeError(f"Stability API failed: {detail[:250]}") from exc

        artifacts = body.get("artifacts") or []
        if not artifacts:
            raise RuntimeError("Stability API returned no artifacts")
        b64 = artifacts[0].get("base64")
        if not b64:
            raise RuntimeError("Stability API artifact missing base64 image")
        return f"data:image/png;base64,{b64}"

    def _generate_dalle(self, prompt_data: Dict[str, Any]) -> str:
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set")

        try:
            from openai import OpenAI
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError("openai package not installed") from exc

        client = OpenAI(api_key=api_key)
        result = client.images.generate(
            model="dall-e-3",
            prompt=prompt_data["full_prompt"],
            size="1024x1024",
            quality="standard",
            n=1,
        )
        if not result.data:
            raise RuntimeError("DALL-E returned no image")
        return result.data[0].url


def build_scene_cards(
    paragraphs: List[str],
    pacing_rows: List[Dict[str, Any]],
    dominant_genre: str,
    art_style: str,
    character_summary: Dict[str, Any],
    mode: str = "mock",
) -> List[Dict[str, Any]]:
    generator = ImageGenerator()
    text = "\n\n".join(paragraphs or [])
    char_result = {
        "characters": {name: summary.get("appears_in_paragraphs", []) for name, summary in (character_summary or {}).items()},
        "paragraphs": paragraphs or [],
    }
    pacing_res = {"pacing": pacing_rows or []}
    return generator.generate_all(text, char_result, pacing_res, dominant_genre, art_style, mode)
