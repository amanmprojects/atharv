"""
Context-aware threshold manager for analysis modules.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict


DEFAULT_CONTEXT: Dict[str, Any] = {
    "genre": "novel",
    "subGenre": "",
    "writingPurpose": "entertain",
    "targetWordCount": "Short (1k-10k)",
    "draftStage": "First Draft",
    "targetAgeGroup": "Adult",
    "readingLevel": "Intermediate",
    "audienceFamiliarity": "Genre fan",
    "marketPlatform": "Self-publish",
    "desiredTone": [],
    "narrativeVoice": "Third limited",
    "pacingPreference": 3,
    "contentSensitivity": "PG-13",
}


class ContextManager:
    """Normalizes context payload and produces threshold overrides."""

    def normalize(self, raw_context: Dict[str, Any] | None) -> Dict[str, Any]:
        context = deepcopy(DEFAULT_CONTEXT)
        if not isinstance(raw_context, dict):
            return context

        # Accept both flat keys (frontend form) and nested legacy keys.
        flattened = self._flatten_legacy_context(raw_context)
        for key in context:
            if key in flattened and flattened[key] is not None:
                context[key] = flattened[key]

        # Normalize commonly used values.
        context["genre"] = str(context.get("genre") or "novel").strip().lower()
        context["draftStage"] = str(context.get("draftStage") or "First Draft").strip()
        context["targetAgeGroup"] = str(context.get("targetAgeGroup") or "Adult").strip()
        context["readingLevel"] = str(context.get("readingLevel") or "Intermediate").strip()
        context["contentSensitivity"] = str(context.get("contentSensitivity") or "PG-13").strip()

        tones = context.get("desiredTone")
        if isinstance(tones, str):
            context["desiredTone"] = [t.strip() for t in tones.split(",") if t.strip()]
        elif isinstance(tones, list):
            context["desiredTone"] = [str(t).strip() for t in tones if str(t).strip()]
        else:
            context["desiredTone"] = []

        try:
            pace = int(context.get("pacingPreference", 3))
        except (TypeError, ValueError):
            pace = 3
        context["pacingPreference"] = min(5, max(1, pace))

        return context

    def adjust_thresholds(self, context: Dict[str, Any] | None) -> Dict[str, Any]:
        ctx = self.normalize(context)
        genre = ctx.get("genre", "novel")
        draft_stage = ctx.get("draftStage", "First Draft").lower()
        age = ctx.get("targetAgeGroup", "Adult").lower()
        reading = ctx.get("readingLevel", "Intermediate").lower()

        config = {
            "pacing_min": 4.5,
            "passive_voice_severity": "low",
            "show_tell_policy": "standard",
            "readability_min": 55.0,
            "long_sentence_limit": 45,
            "soften_all_severity": "first draft" in draft_stage,
            "flag_ya_adult_terms": "ya" in age,
            "content_sensitivity": ctx.get("contentSensitivity", "PG-13"),
            "context": ctx,
        }

        if "thriller" in genre:
            config["pacing_min"] = 6.0
            config["passive_voice_severity"] = "medium"

        if "romance" in genre:
            config["show_tell_policy"] = "strict"

        if "literary" in genre:
            config["readability_min"] = 40.0

        if "beginner" in reading:
            config["long_sentence_limit"] = 20

        # Pacing preference slider (1 slow .. 5 fast)
        pace_pref = int(ctx.get("pacingPreference", 3))
        config["pacing_min"] = max(2.5, min(8.5, config["pacing_min"] + (pace_pref - 3) * 0.6))

        return config

    # Backward-compatible helpers used by older backend wiring.
    def pacing_target(self, context: Dict[str, Any] | None) -> Dict[str, float | str]:
        cfg = self.adjust_thresholds(context)
        return {
            "min": max(1.0, float(cfg["pacing_min"]) - 0.8),
            "max": min(9.5, float(cfg["pacing_min"]) + 2.0),
            "label": "fast" if float(cfg["pacing_min"]) >= 6 else "balanced",
        }

    def show_tell_policy(self, context: Dict[str, Any] | None) -> str:
        return str(self.adjust_thresholds(context).get("show_tell_policy", "standard"))

    def style_hint(self, context: Dict[str, Any] | None) -> str:
        ctx = self.normalize(context)
        purpose = str(ctx.get("writingPurpose", "entertain")).lower()
        if "inform" in purpose:
            return "journalistic"
        if "persuade" in purpose:
            return "formal"
        if "inspire" in purpose:
            return "dramatic"
        return "casual"

    def summarize(self, context: Dict[str, Any] | None) -> Dict[str, Any]:
        ctx = self.normalize(context)
        return {
            "genre": ctx["genre"],
            "subGenre": ctx["subGenre"],
            "draftStage": ctx["draftStage"],
            "targetAgeGroup": ctx["targetAgeGroup"],
            "readingLevel": ctx["readingLevel"],
            "toneCount": len(ctx["desiredTone"]),
            "narrativeVoice": ctx["narrativeVoice"],
            "pacingPreference": ctx["pacingPreference"],
            "contentSensitivity": ctx["contentSensitivity"],
        }

    def _flatten_legacy_context(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if any(k in payload for k in DEFAULT_CONTEXT):
            return payload

        writing = payload.get("writing", {}) if isinstance(payload.get("writing"), dict) else {}
        audience = payload.get("audience", {}) if isinstance(payload.get("audience"), dict) else {}
        tone = payload.get("tone", {}) if isinstance(payload.get("tone"), dict) else {}

        return {
            "genre": writing.get("genre"),
            "subGenre": writing.get("sub_genre") or writing.get("subGenre"),
            "writingPurpose": writing.get("purpose") or writing.get("writingPurpose"),
            "targetWordCount": writing.get("target_word_count") or writing.get("targetWordCount"),
            "draftStage": writing.get("draft_stage") or writing.get("draftStage"),
            "targetAgeGroup": audience.get("age_group") or audience.get("targetAgeGroup"),
            "readingLevel": audience.get("reading_level") or audience.get("readingLevel"),
            "audienceFamiliarity": audience.get("familiarity") or audience.get("audienceFamiliarity"),
            "marketPlatform": audience.get("market_platform") or audience.get("marketPlatform"),
            "desiredTone": tone.get("desired_tone") or tone.get("desiredTone"),
            "narrativeVoice": tone.get("narrative_voice") or tone.get("narrativeVoice"),
            "pacingPreference": tone.get("pacing_preference") or tone.get("pacingPreference"),
            "contentSensitivity": tone.get("content_sensitivity") or tone.get("contentSensitivity"),
        }
