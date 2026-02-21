"""
Genre market trend matcher.
Rule-based market alignment scoring with transparent signals.
"""

from __future__ import annotations

import re
from collections import Counter


TREND_DATABASE = {
    "romance": {
        "market_health": "growing",
        "trending_subgenres": [
            {"name": "dark romance", "pace": "steady"},
            {"name": "romantasy", "pace": "balanced"},
            {"name": "sports romance", "pace": "brisk"},
            {"name": "small town romance", "pace": "slow"},
            {"name": "second chance romance", "pace": "steady"},
        ],
        "hot_tropes": [
            {"name": "enemies-to-lovers", "signal_words": ["enemy", "rival", "hate", "banter"]},
            {"name": "forced proximity", "signal_words": ["trapped", "stuck", "shared room", "storm"]},
            {"name": "grumpy/sunshine", "signal_words": ["grumpy", "cheerful", "sunny", "cold"]},
            {"name": "slow burn", "signal_words": ["longing", "hesitate", "almost", "glance"]},
            {"name": "he falls first", "signal_words": ["protective", "devoted", "watching her", "softened"]},
        ],
        "avoid_tropes": [
            {"name": "instant love with no conflict", "reason": "readers prefer emotional tension and growth"},
            {"name": "flat love interest", "reason": "audiences expect layered leads"},
            {"name": "forced drama without payoff", "reason": "lowers trust in ending"},
        ],
    },
    "thriller": {
        "market_health": "strong",
        "trending_subgenres": [
            {"name": "domestic thriller", "pace": "balanced"},
            {"name": "cozy mystery", "pace": "steady"},
            {"name": "psychological thriller", "pace": "fast"},
            {"name": "legal thriller", "pace": "brisk"},
            {"name": "climate thriller", "pace": "brisk"},
        ],
        "hot_tropes": [
            {"name": "unreliable narrator", "signal_words": ["memory", "unreliable", "truth", "hallucination"]},
            {"name": "small-town secrets", "signal_words": ["town", "secret", "everyone knows", "whisper"]},
            {"name": "female detective lead", "signal_words": ["detective", "inspector", "investigator"]},
            {"name": "social media as plot device", "signal_words": ["feed", "post", "viral", "dm"]},
            {"name": "cold case reopened", "signal_words": ["old case", "archive", "reopen", "unsolved"]},
        ],
        "avoid_tropes": [
            {"name": "late random villain reveal", "reason": "feels unearned"},
            {"name": "constant fake twists", "reason": "twist fatigue"},
            {"name": "no emotional stakes", "reason": "readers want character cost"},
        ],
    },
    "mystery": {
        "market_health": "stable",
        "trending_subgenres": [
            {"name": "cozy mystery", "pace": "steady"},
            {"name": "police procedural", "pace": "balanced"},
            {"name": "locked-room mystery", "pace": "brisk"},
            {"name": "historical mystery", "pace": "slow"},
            {"name": "forensic mystery", "pace": "balanced"},
        ],
        "hot_tropes": [
            {"name": "false lead trail", "signal_words": ["mislead", "false clue", "red herring"]},
            {"name": "hidden motive", "signal_words": ["motive", "inheritance", "alibi"]},
            {"name": "tight suspect circle", "signal_words": ["suspect", "witness", "interview"]},
            {"name": "caseboard logic", "signal_words": ["evidence", "timeline", "case file"]},
            {"name": "reveal with callback", "signal_words": ["earlier", "same mark", "pattern"]},
        ],
        "avoid_tropes": [
            {"name": "clues introduced too late", "reason": "weakens fair-play mystery"},
            {"name": "detective solved by luck only", "reason": "less satisfying logic"},
            {"name": "too many unrelated suspects", "reason": "reader confusion"},
        ],
    },
    "fantasy": {
        "market_health": "growing",
        "trending_subgenres": [
            {"name": "romantasy", "pace": "balanced"},
            {"name": "cozy fantasy", "pace": "slow"},
            {"name": "progression fantasy", "pace": "brisk"},
            {"name": "climate fiction", "pace": "steady"},
            {"name": "hopepunk", "pace": "steady"},
        ],
        "hot_tropes": [
            {"name": "found family", "signal_words": ["crew", "family", "belong", "together"]},
            {"name": "magic academy", "signal_words": ["academy", "mentor", "spell class"]},
            {"name": "chosen one subverted", "signal_words": ["not chosen", "ordinary", "unexpected hero"]},
            {"name": "fae courts", "signal_words": ["court", "fae", "queen", "oath"]},
            {"name": "political intrigue", "signal_words": ["council", "throne", "alliance", "betrayal"]},
        ],
        "avoid_tropes": [
            {"name": "info-dump openings", "reason": "slows immersion"},
            {"name": "generic worldbuilding terms", "reason": "reads derivative"},
            {"name": "power scaling without stakes", "reason": "weak emotional pull"},
        ],
    },
    "comedy": {
        "market_health": "resurgent",
        "trending_subgenres": [
            {"name": "romantic comedy", "pace": "brisk"},
            {"name": "dark comedy", "pace": "balanced"},
            {"name": "satirical fiction", "pace": "steady"},
            {"name": "absurdist", "pace": "brisk"},
            {"name": "cozy slice-of-life", "pace": "slow"},
        ],
        "hot_tropes": [
            {"name": "workplace rivalry", "signal_words": ["office", "boss", "deadline", "coworker"]},
            {"name": "mistaken identity", "signal_words": ["mistaken", "wrong person", "pretend"]},
            {"name": "fish out of water", "signal_words": ["new town", "out of place", "culture shock"]},
            {"name": "reluctant roommates", "signal_words": ["roommate", "shared apartment", "lease"]},
            {"name": "running gag callbacks", "signal_words": ["again", "callback", "same joke"]},
        ],
        "avoid_tropes": [
            {"name": "jokes without character purpose", "reason": "reduces emotional attachment"},
            {"name": "one-note sarcasm", "reason": "voice becomes flat"},
            {"name": "punchline-only dialogue", "reason": "weak scene movement"},
        ],
    },
    "literary": {
        "market_health": "stable",
        "trending_subgenres": [
            {"name": "autofiction", "pace": "slow"},
            {"name": "climate literary", "pace": "steady"},
            {"name": "diaspora stories", "pace": "balanced"},
            {"name": "multi-generational", "pace": "steady"},
            {"name": "short story collections", "pace": "balanced"},
        ],
        "hot_tropes": [
            {"name": "nonlinear timeline", "signal_words": ["years later", "memory", "before", "after"]},
            {"name": "multiple povs", "signal_words": ["i", "she", "he", "we"]},
            {"name": "epistolary elements", "signal_words": ["letter", "journal", "entry", "note"]},
            {"name": "unreliable memory", "signal_words": ["remember", "maybe", "uncertain", "foggy"]},
            {"name": "quiet endings", "signal_words": ["silence", "small gesture", "open ending"]},
        ],
        "avoid_tropes": [
            {"name": "over-symbolized prose", "reason": "feels heavy-handed"},
            {"name": "plotless drift with no emotional arc", "reason": "reader disengagement"},
            {"name": "ornate language every sentence", "reason": "fatigue"},
        ],
    },
}


PACE_BUCKETS = {
    "fast": (6.5, 10.0),
    "brisk": (5.6, 8.4),
    "balanced": (4.3, 7.1),
    "steady": (3.4, 6.2),
    "slow": (0.0, 5.2),
}


def _tokenize(text):
    return set(re.findall(r"\b[a-z][a-z'-]+\b", text.lower()))


def _pace_label(pacing_rows):
    if not pacing_rows:
        return "balanced"
    avg = sum(float(p.get("pacing_score", 0)) for p in pacing_rows) / max(len(pacing_rows), 1)
    if avg >= 6.6:
        return "fast"
    if avg >= 5.5:
        return "brisk"
    if avg >= 4.3:
        return "balanced"
    if avg >= 3.3:
        return "steady"
    return "slow"


def _dialogue_formality(dialogue_profiles):
    if not dialogue_profiles:
        return 0.5
    vals = [float(profile.get("formality", 0.5)) for profile in dialogue_profiles.values()]
    return sum(vals) / max(len(vals), 1)


def _detected_props(text, pacing_rows, genre_rows, dialogue_profiles):
    tokens = _tokenize(text)
    dominant_by_votes = Counter()
    for row in genre_rows or []:
        top = row.get("top_genre")
        conf = float(row.get("confidence", 0.0))
        if top and top != "neutral":
            dominant_by_votes[top] += conf
    dominant_genre = dominant_by_votes.most_common(1)[0][0] if dominant_by_votes else "unknown"
    return {
        "keywords": tokens,
        "pacing_label": _pace_label(pacing_rows),
        "dialogue_formality": _dialogue_formality(dialogue_profiles),
        "dominant_genre": dominant_genre,
    }


def _pace_matches(target_label, actual_label):
    target = PACE_BUCKETS.get(target_label, PACE_BUCKETS["balanced"])
    actual = PACE_BUCKETS.get(actual_label, PACE_BUCKETS["balanced"])
    # overlap check
    return max(target[0], actual[0]) <= min(target[1], actual[1])


def match_trends(
    genre,
    text,
    pacing_rows,
    genre_rows,
    dialogue_profiles,
    context=None,
):
    context = context or {}
    user_genre = str((context.get("writing", {}) or {}).get("genre", "")).lower()
    dominant_genre = (genre or user_genre or "unknown").lower()

    if dominant_genre not in TREND_DATABASE and user_genre in TREND_DATABASE:
        dominant_genre = user_genre

    trend_data = TREND_DATABASE.get(dominant_genre)
    props = _detected_props(text, pacing_rows, genre_rows, dialogue_profiles)

    if not trend_data:
        return {
            "genre": dominant_genre,
            "market_health": "unknown",
            "alignment_score": 50,
            "matches": ["Insufficient genre match in trend database; using neutral baseline."],
            "gaps": ["Select a clearer genre in the context form for more specific market alignment."],
            "trending_subgenres": [],
            "hot_tropes": [],
            "avoid_tropes": [],
            "detected_properties": props,
        }

    matches = []
    gaps = []

    for trope in trend_data["hot_tropes"]:
        hit = any(signal in props["keywords"] for signal in trope["signal_words"])
        if hit:
            matches.append(f"Detected trope signal: '{trope['name']}' is currently hot in {dominant_genre}.")
        else:
            gaps.append(f"Missing strong signal for '{trope['name']}'. Consider adding a light cue.")

    for sub in trend_data["trending_subgenres"]:
        if _pace_matches(sub["pace"], props["pacing_label"]):
            matches.append(f"Current pacing aligns with {sub['name']} ({sub['pace']}).")

    formality = props["dialogue_formality"]
    if dominant_genre in {"romance", "comedy"} and formality > 0.65:
        gaps.append("Dialogue formality is high for this market; consider more intimate/casual voice.")
    if dominant_genre in {"journalistic", "literary"} and formality < 0.35:
        gaps.append("Dialogue/register is very casual; consider tightening language for this audience.")

    # Score: starts at 45 and moves with evidence.
    score = 45 + min(len(matches), 8) * 7 - min(len(gaps), 8) * 4
    score = max(0, min(100, score))

    summary = (
        f"Market alignment for {dominant_genre.title()}: {score}/100. "
        f"Matches: {len(matches)} | Gaps: {len(gaps)}"
    )

    return {
        "genre": dominant_genre,
        "market_health": trend_data["market_health"],
        "alignment_score": score,
        "summary": summary,
        "matches": matches[:8],
        "gaps": gaps[:8],
        "trending_subgenres": trend_data["trending_subgenres"][:5],
        "hot_tropes": [item["name"] for item in trend_data["hot_tropes"][:5]],
        "avoid_tropes": trend_data["avoid_tropes"][:3],
        "detected_properties": props,
    }
