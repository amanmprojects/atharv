"""
Scene illustration pipeline.
Default mode is mock (prompt + generated placeholder image URL).
"""

from __future__ import annotations

import html
import re
import urllib.parse


GENRE_STYLE_MAP = {
    "thriller": "cinematic, high contrast lighting, dramatic shadows",
    "mystery": "moody noir composition, focused highlights, investigative atmosphere",
    "romance": "soft warm lighting, intimate framing, gentle bokeh",
    "fantasy": "epic painterly composition, magical atmosphere, rich world detail",
    "comedy": "bright expressive palette, lively framing, playful mood",
    "literary": "naturalistic composition, subtle texture, contemplative mood",
    "horror": "dark desaturated palette, eerie shadows, unsettling atmosphere",
}


class ScenePromptBuilder:
    LOCATION_WORDS = {
        "room", "hall", "corridor", "street", "forest", "city", "house", "road", "bridge",
        "river", "station", "school", "office", "hospital", "court", "market", "temple",
    }
    LIGHT_WORDS = {"dark", "dim", "glow", "sunlight", "moonlight", "shadow", "fog", "rain", "mist"}
    ACTION_WORDS = {
        "run", "rush", "fight", "grab", "fall", "chase", "whisper", "scream", "stare",
        "smile", "cry", "open", "close", "turn", "hide", "kneel", "climb",
    }

    def extract_visual_sentence(self, paragraph):
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", paragraph) if s.strip()]
        if not sentences:
            return paragraph.strip()

        def score(sentence):
            tokens = set(re.findall(r"\b[a-z]+\b", sentence.lower()))
            scene_hits = len(tokens & self.LOCATION_WORDS)
            light_hits = len(tokens & self.LIGHT_WORDS)
            action_hits = len(tokens & self.ACTION_WORDS)
            return scene_hits * 2 + light_hits * 2 + action_hits + min(len(tokens) / 20.0, 1.0)

        ranked = sorted(sentences, key=score, reverse=True)
        return ranked[0]

    def _character_descriptions(self, paragraph, character_summary):
        if not character_summary:
            return "no named character details available"

        paragraph_lower = paragraph.lower()
        snippets = []
        for character, summary in character_summary.items():
            if character.lower() not in paragraph_lower:
                continue
            emotions = summary.get("emotional_states") or []
            locations = summary.get("locations_mentioned") or []
            emotion_hint = f"showing {emotions[0]} emotion" if emotions else "with neutral expression"
            location_hint = f"associated with {locations[0]}" if locations else "in the current scene"
            snippets.append(f"{character} ({emotion_hint}, {location_hint})")

        if not snippets:
            return "focus on environment and implied protagonist"
        return "; ".join(snippets[:3])

    def _mood_from_pacing(self, pacing_score):
        if pacing_score >= 6.5:
            return "tense, high energy, dynamic camera angle, slight motion blur"
        if pacing_score >= 4.3:
            return "balanced dramatic energy, grounded framing"
        return "calm, contemplative, still frame, atmospheric detail"

    def build_prompt(self, paragraph, character_summary, pacing_score, genre, art_style):
        visual_sentence = self.extract_visual_sentence(paragraph)
        chars = self._character_descriptions(paragraph, character_summary)
        mood = self._mood_from_pacing(float(pacing_score or 0))
        genre_style = GENRE_STYLE_MAP.get(str(genre).lower(), "cinematic composition")
        return (
            f"{visual_sentence}, {chars}, {mood}, {genre_style}, "
            f"{art_style}, highly detailed, storytelling illustration"
        )


def _mock_image_data_url(paragraph_idx, prompt, art_style):
    safe_prompt = html.escape(prompt[:130])
    safe_style = html.escape((art_style or "cinematic").title())
    svg = f"""
<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='#dbeafe'/>
      <stop offset='60%' stop-color='#f8fafc'/>
      <stop offset='100%' stop-color='#e2e8f0'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)' />
  <rect x='36' y='36' width='888' height='468' fill='none' stroke='#94a3b8' stroke-width='2' rx='16' />
  <text x='64' y='96' font-size='32' font-family='Georgia, serif' fill='#0f172a'>Scene {paragraph_idx}</text>
  <text x='64' y='136' font-size='20' font-family='Georgia, serif' fill='#1e293b'>Style: {safe_style}</text>
  <text x='64' y='190' font-size='18' font-family='Georgia, serif' fill='#334155'>Prompt Preview:</text>
  <foreignObject x='64' y='208' width='832' height='250'>
    <div xmlns='http://www.w3.org/1999/xhtml' style='font-size:16px;line-height:1.35;color:#334155;font-family:Georgia,serif'>
      {safe_prompt}
    </div>
  </foreignObject>
  <text x='64' y='486' font-size='14' font-family='Georgia, serif' fill='#64748b'>Mock image mode (no paid API call)</text>
</svg>
""".strip()
    return "data:image/svg+xml;charset=utf-8," + urllib.parse.quote(svg)


def build_scene_cards(
    paragraphs,
    pacing_rows,
    dominant_genre,
    art_style,
    character_summary,
    mode="mock",
):
    builder = ScenePromptBuilder()
    cards = []

    pace_by_paragraph = {int(row.get("paragraph", 0)): row for row in (pacing_rows or [])}
    style_value = art_style or "cinematic"
    image_mode = (mode or "mock").lower()

    for idx, paragraph in enumerate(paragraphs, start=1):
        if not paragraph.strip():
            continue
        pacing_score = float(pace_by_paragraph.get(idx, {}).get("pacing_score", 0))
        prompt = builder.build_prompt(
            paragraph=paragraph,
            character_summary=character_summary or {},
            pacing_score=pacing_score,
            genre=dominant_genre or "unknown",
            art_style=style_value,
        )

        cards.append(
            {
                "paragraph": idx,
                "source_text": paragraph[:300],
                "prompt": prompt,
                "art_style": style_value,
                "mode": image_mode,
                "image_url": _mock_image_data_url(idx, prompt, style_value),
                "status": "generated" if image_mode == "mock" else "queued",
            }
        )

    return cards
