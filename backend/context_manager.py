"""
Context manager for user intake data.
Keeps analysis context-aware without relying on hosted LLMs.
"""

from __future__ import annotations

from copy import deepcopy


DEFAULT_CONTEXT = {
    "writing": {
        "genre": "unknown",
        "sub_genre": "",
        "purpose": "entertain",
        "target_word_count": 1200,
        "draft_stage": "first_draft",
    },
    "audience": {
        "age_group": "adult",
        "reading_level": "intermediate",
        "familiarity": "mixed",
        "market_platform": "self_publish",
    },
    "tone": {
        "desired_tone": "balanced",
        "narrative_voice": "third_limited",
        "pacing_preference": "balanced",
        "content_sensitivity": "pg_13",
        "art_style": "cinematic",
    },
}


GENRE_PACING_TARGETS = {
    "thriller": {"min": 5.8, "max": 8.8, "label": "fast"},
    "mystery": {"min": 4.6, "max": 7.2, "label": "balanced"},
    "romance": {"min": 3.5, "max": 6.4, "label": "steady"},
    "fantasy": {"min": 4.2, "max": 7.0, "label": "balanced"},
    "comedy": {"min": 4.8, "max": 7.6, "label": "brisk"},
    "literary": {"min": 2.8, "max": 5.4, "label": "slow"},
    "journalistic": {"min": 4.2, "max": 6.4, "label": "direct"},
}


class ContextManager:
    def normalize(self, raw_context):
        """Return a complete context dict with safe defaults."""
        context = deepcopy(DEFAULT_CONTEXT)
        if not isinstance(raw_context, dict):
            return context

        for section in ("writing", "audience", "tone"):
            incoming = raw_context.get(section)
            if not isinstance(incoming, dict):
                continue
            for key, value in incoming.items():
                if key in context[section]:
                    context[section][key] = value

        # Normalize a few keys for downstream matching.
        context["writing"]["genre"] = str(context["writing"]["genre"] or "unknown").strip().lower()
        context["writing"]["sub_genre"] = str(context["writing"]["sub_genre"] or "").strip().lower()
        context["tone"]["pacing_preference"] = str(
            context["tone"]["pacing_preference"] or "balanced"
        ).strip().lower()
        context["audience"]["reading_level"] = str(
            context["audience"]["reading_level"] or "intermediate"
        ).strip().lower()
        context["tone"]["content_sensitivity"] = str(
            context["tone"]["content_sensitivity"] or "pg_13"
        ).strip().lower()
        context["tone"]["art_style"] = str(context["tone"]["art_style"] or "cinematic").strip().lower()

        return context

    def pacing_target(self, context):
        """Return target pacing range inferred from genre + preference."""
        writing = context.get("writing", {})
        tone = context.get("tone", {})

        genre = str(writing.get("genre") or "unknown").lower()
        preference = str(tone.get("pacing_preference") or "balanced").lower()
        target = deepcopy(GENRE_PACING_TARGETS.get(genre, {"min": 4.2, "max": 6.8, "label": "balanced"}))

        if preference in {"fast", "fast_paced", "rapid"}:
            target["min"] = min(9.0, target["min"] + 0.8)
            target["max"] = min(9.5, target["max"] + 0.6)
            target["label"] = "fast"
        elif preference in {"slow", "literary", "deliberate"}:
            target["min"] = max(1.0, target["min"] - 0.9)
            target["max"] = max(target["min"] + 0.8, target["max"] - 1.0)
            target["label"] = "slow"

        return target

    def show_tell_policy(self, context):
        """Adjust strictness of show-vs-tell warnings by audience and purpose."""
        audience = context.get("audience", {})
        tone = context.get("tone", {})
        writing = context.get("writing", {})

        reading_level = str(audience.get("reading_level") or "intermediate").lower()
        age_group = str(audience.get("age_group") or "adult").lower()
        purpose = str(writing.get("purpose") or "entertain").lower()
        sensitivity = str(tone.get("content_sensitivity") or "pg_13").lower()

        # Higher multiplier => stricter detector.
        strictness = 1.0
        if reading_level == "advanced":
            strictness += 0.2
        if "children" in age_group:
            strictness -= 0.25
        if purpose in {"inform", "academic"}:
            strictness += 0.1
        if sensitivity in {"pg", "children"}:
            strictness -= 0.1

        if strictness >= 1.1:
            return "strict"
        if strictness <= 0.85:
            return "lenient"
        return "standard"

    def style_hint(self, context):
        """Suggest default style target when user style is not explicit."""
        writing = context.get("writing", {})
        audience = context.get("audience", {})

        purpose = str(writing.get("purpose") or "entertain").lower()
        market = str(audience.get("market_platform") or "self_publish").lower()

        if purpose in {"inform", "academic"} or "journal" in market:
            return "journalistic"
        if purpose in {"persuade"}:
            return "formal"
        return "dramatic" if purpose == "inspire" else "casual"

    def summarize(self, context):
        writing = context.get("writing", {})
        audience = context.get("audience", {})
        tone = context.get("tone", {})
        return {
            "genre": writing.get("genre", "unknown"),
            "sub_genre": writing.get("sub_genre", ""),
            "purpose": writing.get("purpose", "entertain"),
            "draft_stage": writing.get("draft_stage", "first_draft"),
            "audience": f"{audience.get('age_group', 'adult')} / {audience.get('reading_level', 'intermediate')}",
            "tone_goal": tone.get("desired_tone", "balanced"),
            "voice_goal": tone.get("narrative_voice", "third_limited"),
            "pacing_preference": tone.get("pacing_preference", "balanced"),
            "content_sensitivity": tone.get("content_sensitivity", "pg_13"),
            "art_style": tone.get("art_style", "cinematic"),
        }
