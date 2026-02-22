"""
Market trend matcher for writing analysis.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List


def _genre_pack(
    subgenres: List[Dict[str, Any]],
    hot: List[Dict[str, Any]],
    avoid: List[Dict[str, Any]],
    notes: str,
    pacing: str,
    formality: str,
) -> Dict[str, Any]:
    return {
        "trending_subgenres": subgenres,
        "hot_tropes": hot,
        "avoid_tropes": avoid,
        "market_notes": notes,
        "pacing_expectation": pacing,
        "formality_expectation": formality,
    }


TREND_DATABASE: Dict[str, Dict[str, Any]] = {}


def _token_set(text: str) -> set[str]:
    return set(re.findall(r"\\b[a-z][a-z0-9'-]*\\b", (text or "").lower()))


def _contains_signal(text: str, tokens: set[str], signal: str) -> bool:
    candidate = signal.lower().strip()
    if not candidate:
        return False
    if " " in candidate:
        return candidate in text
    return candidate in tokens


def _normalize_genre(genre: str) -> str:
    raw = str(genre or "").strip().lower()
    mapping = {
        "sci-fi": "scifi",
        "science fiction": "scifi",
        "science_fiction": "scifi",
        "young adult": "ya",
        "children": "childrens",
        "children's": "childrens",
    }
    return mapping.get(raw, raw)


def _pace_bucket(pacing_label: Any) -> str:
    text = str(pacing_label or "").lower()
    if "high" in text or "fast" in text:
        return "fast"
    if "slow" in text or "reflective" in text:
        return "slow"
    return "medium"


def _formality_bucket(readability_score: float, avg_sentence_len: float) -> str:
    if readability_score <= 45 or avg_sentence_len >= 24:
        return "high"
    if readability_score >= 70 and avg_sentence_len <= 16:
        return "low"
    return "medium"

TREND_DATABASE["romance"] = _genre_pack(
    subgenres=[
        {"name": "Dark Romance", "description": "Morally gray love stories with danger-heavy emotional stakes.", "growth": "rising", "signal_words": ["obsession", "forbidden", "dangerous", "possessive", "mafia"]},
        {"name": "Romantasy", "description": "Fantasy setting where romance is a primary narrative engine.", "growth": "rising", "signal_words": ["fae", "court", "magic", "bond", "curse"]},
        {"name": "Sports Romance", "description": "Athlete-driven relationship arcs with comeback pressure.", "growth": "rising", "signal_words": ["rookie", "locker room", "season", "captain", "training"]},
        {"name": "Small-Town Romance", "description": "Community-centered relationship narratives with cozy setting identity.", "growth": "stable", "signal_words": ["small town", "main street", "festival", "neighbor", "inn"]},
        {"name": "Second-Chance Romance", "description": "Former partners reconnect through unresolved history.", "growth": "stable", "signal_words": ["again", "past", "ex", "reconcile", "history"]},
    ],
    hot=[
        {"name": "enemies-to-lovers", "description": "Conflict-heavy pairings that evolve into intimacy.", "signal_words": ["rival", "enemy", "banter", "argue", "hate"], "why_trending": "High-friction chemistry improves hook strength."},
        {"name": "forced proximity", "description": "Characters are constrained into shared space.", "signal_words": ["trapped", "stuck", "shared", "snowed in", "cohabitate"], "why_trending": "Constraint accelerates emotional reveals naturally."},
        {"name": "grumpy-sunshine", "description": "Contrasting temperaments shape growth beats.", "signal_words": ["grumpy", "sunny", "cheerful", "stoic", "cold"], "why_trending": "Voice contrast drives memorable scene energy."},
        {"name": "slow burn", "description": "Romantic payoff delayed for earned tension.", "signal_words": ["longing", "almost", "hesitate", "yearn", "unspoken"], "why_trending": "Readers value delayed but satisfying payoff."},
        {"name": "he falls first", "description": "Male lead vulnerability appears clearly and early.", "signal_words": ["protective", "softened", "devoted", "waited", "careful"], "why_trending": "Emotionally explicit leads convert well in current market."},
    ],
    avoid=[
        {"name": "miscommunication-only conflict", "reason": "Avoidable conflict loops are increasingly rejected by readers and editors.", "signal_words": ["never asked", "assumed", "walked away"]},
        {"name": "instant love without development", "reason": "Current market prefers emotional build over immediate certainty.", "signal_words": ["instantly in love", "love at first sight"]},
        {"name": "flat love interest", "reason": "Dual agency and layered motivation are now baseline expectations.", "signal_words": ["perfect man", "perfect woman", "no flaws"]},
    ],
    notes="Romance remains one of the strongest categories in 2024-2025. Trope execution quality and emotional specificity matter more than premise alone.",
    pacing="medium",
    formality="low",
)

TREND_DATABASE["thriller"] = _genre_pack(
    subgenres=[
        {"name": "Psychological Thriller", "description": "Identity and perception destabilization under tension.", "growth": "rising", "signal_words": ["memory", "gaslight", "paranoia", "hallucination", "truth"]},
        {"name": "Domestic Thriller", "description": "Household and relationship spaces become threat zones.", "growth": "rising", "signal_words": ["husband", "wife", "suburb", "neighbor", "affair"]},
        {"name": "Legal Thriller", "description": "Courtroom stakes with procedural reversals.", "growth": "stable", "signal_words": ["trial", "attorney", "evidence", "jury", "verdict"]},
        {"name": "Techno Thriller", "description": "Surveillance, cyber-risk, or AI misuse drives suspense.", "growth": "rising", "signal_words": ["surveillance", "algorithm", "hack", "drone", "breach"]},
        {"name": "Conspiracy Thriller", "description": "Institutional cover-ups and hidden actors.", "growth": "stable", "signal_words": ["cover-up", "classified", "agency", "whistleblower", "leak"]},
    ],
    hot=[
        {"name": "unreliable narrator", "description": "Perspective is intentionally unstable.", "signal_words": ["remember", "blackout", "can't trust", "unclear", "lie"], "why_trending": "Discussion-driven endings perform strongly."},
        {"name": "small-town secrets", "description": "Closed social web hiding shared guilt.", "signal_words": ["everyone knows", "town", "secret", "whisper", "missing"], "why_trending": "Setting identity supports discoverability."},
        {"name": "cold case reopened", "description": "Historic crime becomes active threat.", "signal_words": ["archive", "reopen", "old file", "unsolved", "evidence locker"], "why_trending": "Combines nostalgia with investigative urgency."},
        {"name": "time pressure", "description": "Clear deadlines shape scene rhythm.", "signal_words": ["deadline", "countdown", "hours left", "before dawn", "timer"], "why_trending": "Urgency improves retention chapter-to-chapter."},
        {"name": "breadcrumb twist", "description": "Late reveal is seeded by early clues.", "signal_words": ["earlier", "pattern", "callback", "noticed before", "same mark"], "why_trending": "Earned twists outperform shock-only reveals."},
    ],
    avoid=[
        {"name": "random final-villain reveal", "reason": "Unseeded reveal breaks trust in suspense logic.", "signal_words": ["out of nowhere", "unknown villain"]},
        {"name": "fake-out cliffhanger every chapter", "reason": "Overuse causes twist fatigue and lowers engagement.", "signal_words": ["false alarm", "not really dead"]},
        {"name": "no personal stakes", "reason": "Readers expect emotional cost tied to the main conflict.", "signal_words": ["didn't care", "no consequence"]},
    ],
    notes="Thriller demand is robust in 2024-2025, especially psychological and domestic variants. Pace discipline and emotional stakes remain primary acquisition filters.",
    pacing="fast",
    formality="medium",
)

TREND_DATABASE["mystery"] = _genre_pack(
    subgenres=[
        {"name": "Cozy Mystery", "description": "Low-gore puzzle mysteries with place-driven charm.", "growth": "rising", "signal_words": ["village", "bookshop", "amateur sleuth", "cafe", "festival"]},
        {"name": "Locked-Room Mystery", "description": "Impossible-crime logic architecture.", "growth": "stable", "signal_words": ["sealed", "locked", "impossible", "inside", "alibi"]},
        {"name": "Historical Mystery", "description": "Period investigations anchored in setting detail.", "growth": "stable", "signal_words": ["manor", "telegram", "archive", "victorian", "coach"]},
        {"name": "Forensic Mystery", "description": "Evidence science drives progression.", "growth": "stable", "signal_words": ["forensic", "trace", "lab", "dna", "autopsy"]},
        {"name": "Procedural Mystery", "description": "Stepwise investigation realism.", "growth": "stable", "signal_words": ["interview", "warrant", "timeline", "case file", "suspect"]},
    ],
    hot=[
        {"name": "red herring network", "description": "Layered misdirection with fair clues.", "signal_words": ["red herring", "false clue", "wrong suspect", "planted evidence", "mislead"], "why_trending": "Puzzle readers reward fair complexity."},
        {"name": "closed suspect circle", "description": "Finite cast supports deduction clarity.", "signal_words": ["guest list", "inner circle", "everyone present", "suspect", "alibi"], "why_trending": "Cleaner structure supports stronger reveals."},
        {"name": "caseboard reconstruction", "description": "Visible clue-to-conclusion chain.", "signal_words": ["timeline", "board", "motive", "means", "opportunity"], "why_trending": "Transparent reasoning improves reader trust."},
        {"name": "personal stake detective", "description": "Investigator has emotional tie to case.", "signal_words": ["family", "mentor", "old friend", "home town", "legacy"], "why_trending": "Character attachment broadens audience."},
        {"name": "callback reveal", "description": "Solution leverages an early seeded detail.", "signal_words": ["first chapter", "earlier clue", "same symbol", "noticed then", "pattern"], "why_trending": "Fair-play endings drive recommendations."},
    ],
    avoid=[
        {"name": "late-introduced culprit", "reason": "Violates fair-play conventions.", "signal_words": ["never mentioned before", "new character did it"]},
        {"name": "logic-leap solution", "reason": "Deduction without evidence undercuts credibility.", "signal_words": ["just knew", "gut told me"]},
        {"name": "overcrowded suspect list", "reason": "Too many weak threads reduce clarity.", "signal_words": ["dozens of suspects", "everyone is suspicious"]},
    ],
    notes="Mystery is stable with continued strength in cozy and puzzle-forward formats. Clarity of clue architecture is a major quality signal in current buying trends.",
    pacing="medium",
    formality="medium",
)

TREND_DATABASE["fantasy"] = _genre_pack(
    subgenres=[
        {"name": "Romantasy", "description": "Romance-forward fantasy worldbuilding.", "growth": "rising", "signal_words": ["fae", "court", "bond", "heir", "magic"]},
        {"name": "Cozy Fantasy", "description": "Warm low-conflict magical daily life.", "growth": "rising", "signal_words": ["tea", "inn", "village", "shop", "apprentice"]},
        {"name": "Progression Fantasy", "description": "Systematic growth and tier advancement.", "growth": "rising", "signal_words": ["rank", "tier", "level", "trial", "cultivation"]},
        {"name": "Epic Political Fantasy", "description": "Faction strategy and governance conflict.", "growth": "stable", "signal_words": ["throne", "alliance", "council", "empire", "betrayal"]},
        {"name": "Dark Academy Fantasy", "description": "Institutional magic with social pressure.", "growth": "stable", "signal_words": ["academy", "ritual", "faculty", "dormitory", "forbidden spell"]},
    ],
    hot=[
        {"name": "found family", "description": "Chosen bonds replace isolation.", "signal_words": ["crew", "belong", "family", "together", "our people"], "why_trending": "Community arcs increase retention and fandom."},
        {"name": "political intrigue", "description": "Strategic faction conflict beyond combat.", "signal_words": ["council", "treaty", "spy", "alliance", "betrayal"], "why_trending": "Multi-layer stakes support longer series."},
        {"name": "magic-with-cost", "description": "Power use creates explicit consequences.", "signal_words": ["cost", "drained", "sacrifice", "blood price", "debt"], "why_trending": "Constraint-driven systems feel credible."},
        {"name": "mentor fracture", "description": "Guide relationship breaks under pressure.", "signal_words": ["mentor", "training", "betrayed", "lesson", "disillusioned"], "why_trending": "Character rupture increases momentum."},
        {"name": "ancient secret reveal", "description": "Hidden history reframes present stakes.", "signal_words": ["ancient", "ruin", "forgotten", "origin", "seal"], "why_trending": "Lore payoff drives fan discussion."},
    ],
    avoid=[
        {"name": "front-loaded lore dump", "reason": "Heavy exposition can stall onboarding.", "signal_words": ["as everyone knows", "history lesson"]},
        {"name": "power creep without stakes", "reason": "Escalation must carry emotional cost.", "signal_words": ["unstoppable", "no challenge"]},
        {"name": "generic worldbuilding labels only", "reason": "Surface novelty underperforms with current readers.", "signal_words": ["random apostrophe names", "renamed earth terms"]},
    ],
    notes="Fantasy growth is concentrated around romantasy and progression formats in 2024-2025. Clear promise plus emotional clarity generally beats maximal lore density.",
    pacing="medium",
    formality="medium",
)

TREND_DATABASE["scifi"] = _genre_pack(
    subgenres=[
        {"name": "Climate Sci-Fi", "description": "Near-future ecological stress and adaptation.", "growth": "rising", "signal_words": ["flood", "drought", "heat", "resettlement", "carbon"]},
        {"name": "AI Governance Sci-Fi", "description": "Policy and ethics around automated systems.", "growth": "rising", "signal_words": ["alignment", "algorithm", "autonomous", "regulation", "surveillance"]},
        {"name": "Grounded Space Opera", "description": "Large scope with human-scale stakes.", "growth": "stable", "signal_words": ["fleet", "orbit", "station", "colony", "jump gate"]},
        {"name": "Biotech Sci-Fi", "description": "Biology and experimentation risk arcs.", "growth": "stable", "signal_words": ["gene", "mutation", "specimen", "lab", "protocol"]},
        {"name": "First Contact Sci-Fi", "description": "Communication and diplomacy with non-human intelligence.", "growth": "stable", "signal_words": ["signal", "contact", "translation", "envoy", "species"]},
    ],
    hot=[
        {"name": "ethical technology dilemma", "description": "Core conflict from plausible tech ethics.", "signal_words": ["privacy", "control", "consent", "override", "bias"], "why_trending": "Contemporary relevance drives discoverability."},
        {"name": "resource scarcity pressure", "description": "Logistics constraints shape decisions.", "signal_words": ["ration", "oxygen", "fuel", "water", "shortage"], "why_trending": "Constraint systems improve tension credibility."},
        {"name": "ideology-split crew", "description": "Team conflict on values not just tactics.", "signal_words": ["crew", "mutiny", "faction", "vote", "captain"], "why_trending": "Character conflict broadens appeal."},
        {"name": "hard-problem puzzle", "description": "Science-informed problem solving arc.", "signal_words": ["equation", "calibrate", "trajectory", "simulation", "anomaly"], "why_trending": "Competence narratives are trending with readers."},
        {"name": "human story in large system", "description": "Personal arc framed by institutional pressure.", "signal_words": ["worker", "family", "station", "debt", "home"], "why_trending": "Human-scale stakes improve emotional engagement."},
    ],
    avoid=[
        {"name": "jargon overload", "reason": "Excess technical density can reduce readability.", "signal_words": ["technicobabble", "undefined acronym"]},
        {"name": "lecture-style exposition", "reason": "Readers prefer conflict-led information delivery.", "signal_words": ["let me explain", "as you know"]},
        {"name": "tech solves everything", "reason": "Stories need tradeoffs, limits, and cost.", "signal_words": ["perfect solution", "no downside"]},
    ],
    notes="Sci-fi interest is healthy where conceptual novelty pairs with accessible character stakes. Near-future social relevance is a strong 2024-2025 signal.",
    pacing="medium",
    formality="high",
)

TREND_DATABASE["comedy"] = _genre_pack(
    subgenres=[
        {"name": "Romantic Comedy", "description": "Relationship arc powered by comic friction.", "growth": "stable", "signal_words": ["awkward", "date", "meet-cute", "banter", "chemistry"]},
        {"name": "Workplace Comedy", "description": "Institutional absurdity and role friction.", "growth": "rising", "signal_words": ["office", "manager", "meeting", "policy", "coworker"]},
        {"name": "Dark Comedy", "description": "Serious stakes framed with irony and tonal contrast.", "growth": "stable", "signal_words": ["grim", "absurd", "morbid", "disaster", "satire"]},
        {"name": "Social Satire Comedy", "description": "Cultural critique through heightened scenarios.", "growth": "rising", "signal_words": ["viral", "brand", "trend", "performative", "platform"]},
        {"name": "Slice-of-Life Comedy", "description": "Everyday humor with character warmth.", "growth": "stable", "signal_words": ["roommate", "errand", "cafe", "neighbor", "routine"]},
    ],
    hot=[
        {"name": "escalating misunderstanding", "description": "Small mistake compounds into major social conflict.", "signal_words": ["mistaken", "mix-up", "wrong person", "assumed", "double booked"], "why_trending": "Reliable engine for scene-by-scene momentum."},
        {"name": "callback gag", "description": "Earlier joke returns with a stronger payoff.", "signal_words": ["again", "callback", "running gag", "same joke", "still"], "why_trending": "Callbacks increase memorability and reader delight."},
        {"name": "competence mismatch duo", "description": "Contrasting skill levels produce timing-based humor.", "signal_words": ["expert", "novice", "chaos", "mentor", "improvise"], "why_trending": "Supports both humor and character growth."},
        {"name": "status flip", "description": "Power hierarchy reverses unexpectedly.", "signal_words": ["promotion", "demotion", "boss", "intern", "role reversal"], "why_trending": "Social inversion is highly shareable."},
        {"name": "self-aware narration", "description": "Narrator voice acknowledges comedic framing.", "signal_words": ["in hindsight", "to be fair", "obviously", "note to self", "anyway"], "why_trending": "Voice-forward comedy performs well digitally."},
    ],
    avoid=[
        {"name": "insult-only humor", "reason": "Mean-spirited tone narrows audience fit.", "signal_words": ["idiot", "loser", "stupid"]},
        {"name": "no scene progression", "reason": "Jokes must still advance plot/character.", "signal_words": ["nothing happened", "just joking"]},
        {"name": "single-pattern repetition", "reason": "Comedic pacing needs variation.", "signal_words": ["same bit again", "repeat joke"]},
    ],
    notes="Comedy performs best when voice is distinct and emotionally anchored. Character-led humor generally outperforms gag-only structures in current reading trends.",
    pacing="fast",
    formality="low",
)

TREND_DATABASE["literary"] = _genre_pack(
    subgenres=[
        {"name": "Autofiction", "description": "Memory and identity blending autobiography and fiction.", "growth": "rising", "signal_words": ["memory", "self", "childhood", "city", "archive"]},
        {"name": "Climate Literary", "description": "Interiority framed by ecological change.", "growth": "rising", "signal_words": ["heat", "coast", "season", "flood", "ash"]},
        {"name": "Diaspora Literary", "description": "Migration, language, and belonging arcs.", "growth": "stable", "signal_words": ["migration", "accent", "home", "border", "translation"]},
        {"name": "Intergenerational Literary", "description": "Family lines and inherited memory.", "growth": "stable", "signal_words": ["grandmother", "legacy", "lineage", "siblings", "inherit"]},
        {"name": "Hybrid Form Literary", "description": "Prose blended with documents or fragment forms.", "growth": "stable", "signal_words": ["journal", "entry", "fragment", "note", "document"]},
    ],
    hot=[
        {"name": "nonlinear memory structure", "description": "Temporal movement mirrors emotional logic.", "signal_words": ["years later", "before", "after", "remember", "once"], "why_trending": "Structure and theme alignment are valued by editors."},
        {"name": "precise sensory detail", "description": "Concrete detail carries emotional subtext.", "signal_words": ["smell", "texture", "light", "sound", "dust"], "why_trending": "Specificity signals craft quality."},
        {"name": "quiet consequential ending", "description": "Subtle closure with thematic resonance.", "signal_words": ["silence", "small gesture", "open ending", "kept", "left"], "why_trending": "Earned ambiguity is favored over explicit moralizing."},
        {"name": "voice-led introspection", "description": "Interiority drives narrative pressure.", "signal_words": ["I wondered", "I thought", "perhaps", "I noticed", "I felt"], "why_trending": "Distinct voice is a primary differentiator."},
        {"name": "object motif recurrence", "description": "Physical objects anchor emotional continuity.", "signal_words": ["letter", "photograph", "key", "table", "coat"], "why_trending": "Motif coherence improves structural unity."},
    ],
    avoid=[
        {"name": "ornate prose every line", "reason": "Constant density can flatten rhythm and impact.", "signal_words": ["purple prose", "excessive metaphor"]},
        {"name": "theme spelled out directly", "reason": "Heavy-handed statements weaken reader inference.", "signal_words": ["the moral is", "this means"]},
        {"name": "plotless drift", "reason": "Quiet fiction still needs directional emotional movement.", "signal_words": ["went nowhere", "nothing changed"]},
    ],
    notes="Literary is selective but receptive to controlled form and distinctive voice in 2024-2025. Emotional precision and structural intention remain core acquisition signals.",
    pacing="slow",
    formality="high",
)

TREND_DATABASE["horror"] = _genre_pack(
    subgenres=[
        {"name": "Folk Horror", "description": "Ritual, place, and inherited dread.", "growth": "rising", "signal_words": ["ritual", "village", "woods", "idol", "old god"]},
        {"name": "Body Horror", "description": "Physical transformation and identity dread.", "growth": "stable", "signal_words": ["flesh", "bone", "infection", "mutation", "skin"]},
        {"name": "Domestic Horror", "description": "Home environment becomes threatening.", "growth": "rising", "signal_words": ["house", "attic", "hallway", "nursery", "locked door"]},
        {"name": "Corporate Horror", "description": "Institutional systems as existential threat.", "growth": "rising", "signal_words": ["office", "badge", "compliance", "policy", "floor"]},
        {"name": "Cosmic Horror", "description": "Scale and unknowability as fear source.", "growth": "stable", "signal_words": ["void", "ancient", "stars", "impossible", "geometry"]},
    ],
    hot=[
        {"name": "slow dread escalation", "description": "Fear grows via repeated subtle disturbance.", "signal_words": ["again", "strange", "whisper", "cold", "watching"], "why_trending": "Atmosphere-first horror has strong critical traction."},
        {"name": "rule-based threat", "description": "Antagonistic force has discoverable constraints.", "signal_words": ["rule", "must", "don't", "before", "if"], "why_trending": "Clear threat logic sustains tension quality."},
        {"name": "grief-driven horror", "description": "Loss reframed into supernatural or psychological fear.", "signal_words": ["grief", "mourning", "regret", "gone", "funeral"], "why_trending": "Emotionally grounded horror reaches broader audiences."},
        {"name": "hostile architecture", "description": "Space itself destabilizes character safety.", "signal_words": ["corridor", "basement", "walls", "room changed", "door moved"], "why_trending": "Spatial paranoia translates strongly in adaptation channels."},
        {"name": "final-image sting", "description": "Ending image reframes apparent safety.", "signal_words": ["still there", "not over", "final glance", "again", "last image"], "why_trending": "Memorable endings drive recommendation behavior."},
    ],
    avoid=[
        {"name": "jump-scare-only structure", "reason": "Without dread buildup, scares lose compounding impact.", "signal_words": ["random scream", "boo"]},
        {"name": "all lore no fear", "reason": "Exposition should not replace scene-level tension.", "signal_words": ["long explanation", "history monologue"]},
        {"name": "invincible protagonist", "reason": "Vulnerability is essential for horror stakes.", "signal_words": ["untouchable", "never in danger"]},
    ],
    notes="Horror remains strong across print and digital formats. Folk and domestic horror are notable growth pockets with high response to atmosphere and vulnerability.",
    pacing="medium",
    formality="medium",
)

TREND_DATABASE["journalistic"] = _genre_pack(
    subgenres=[
        {"name": "Explainer Journalism", "description": "Complex topics translated with context density.", "growth": "rising", "signal_words": ["why it matters", "what we know", "context", "timeline", "background"]},
        {"name": "Data Journalism", "description": "Narrative anchored in quant evidence.", "growth": "stable", "signal_words": ["data", "percent", "dataset", "analysis", "method"]},
        {"name": "Investigative Reporting", "description": "Document-based accountability reporting.", "growth": "stable", "signal_words": ["records", "documents", "investigation", "audit", "source"]},
        {"name": "Solutions Journalism", "description": "Problem framing plus evidence-backed interventions.", "growth": "rising", "signal_words": ["solution", "program", "pilot", "outcome", "impact"]},
        {"name": "First-Person Reportage", "description": "On-scene reported perspective.", "growth": "stable", "signal_words": ["on the ground", "at the site", "field notes", "witnessed", "reported"]},
    ],
    hot=[
        {"name": "clear nut graf", "description": "Early paragraph states stakes and angle.", "signal_words": ["at stake", "key question", "central issue", "why this matters", "this story"], "why_trending": "Immediate framing improves completion rates."},
        {"name": "source transparency", "description": "Precise attribution and evidence pathways.", "signal_words": ["according to", "records show", "confirmed", "documents", "source said"], "why_trending": "Trust signals are a major differentiator."},
        {"name": "method disclosure", "description": "Story explains verification and limits.", "signal_words": ["methodology", "cross-checked", "verified", "sample size", "reviewed"], "why_trending": "Method notes reduce skepticism."},
        {"name": "human-impact framing", "description": "Data connected to lived consequences.", "signal_words": ["resident", "family", "worker", "student", "patient"], "why_trending": "Audience engagement rises with human context."},
        {"name": "timeline reconstruction", "description": "Chronology clarifies causality.", "signal_words": ["timeline", "first", "then", "later", "before"], "why_trending": "Temporal clarity helps dense topics perform better."},
    ],
    avoid=[
        {"name": "unsupported claims", "reason": "Editorial credibility depends on evidence-backed statements.", "signal_words": ["everyone knows", "obviously true"]},
        {"name": "loaded adjectives", "reason": "Overly evaluative tone can weaken trust.", "signal_words": ["outrageous", "disgraceful", "shocking"]},
        {"name": "unclear attribution", "reason": "Readers need source pathways for confidence.", "signal_words": ["some say", "people say", "sources claim"]},
    ],
    notes="Journalistic writing trends in 2024-2025 reward trust and clarity: explicit sourcing, method transparency, and contextual framing.",
    pacing="medium",
    formality="high",
)

TREND_DATABASE["ya"] = _genre_pack(
    subgenres=[
        {"name": "YA Romantasy", "description": "Fantasy-romance with age-appropriate coming-of-age stakes.", "growth": "rising", "signal_words": ["academy", "trial", "fae", "heir", "coming of age"]},
        {"name": "Contemporary YA", "description": "Identity and social pressure arcs in current settings.", "growth": "stable", "signal_words": ["school", "friend group", "graduation", "identity", "crush"]},
        {"name": "YA Thriller", "description": "Fast mystery/suspense from teen POV.", "growth": "stable", "signal_words": ["missing", "locker", "anonymous", "secret", "deadline"]},
        {"name": "Speculative YA", "description": "Near-future social system conflict.", "growth": "stable", "signal_words": ["district", "protocol", "ranking", "rebel", "system"]},
        {"name": "Hybrid/Graphic YA", "description": "Mixed-media narrative components.", "growth": "rising", "signal_words": ["chat log", "screenshot", "post", "entry", "message"]},
    ],
    hot=[
        {"name": "identity-under-pressure", "description": "Self-definition under social/institutional stress.", "signal_words": ["who I am", "belong", "identity", "fit in", "choice"], "why_trending": "Identity arcs remain central in YA demand."},
        {"name": "friendship core", "description": "Peer relationships hold key emotional stakes.", "signal_words": ["friends", "crew", "group chat", "trust", "together"], "why_trending": "Friendship-forward narratives sustain fandom engagement."},
        {"name": "mentor complication", "description": "Authority figures are limited, mixed, or compromised.", "signal_words": ["teacher", "coach", "mentor", "lied", "hidden"], "why_trending": "Complex authority dynamics feel authentic to YA readers."},
        {"name": "visible chapter stakes", "description": "Each chapter advances urgency clearly.", "signal_words": ["countdown", "deadline", "must", "tomorrow", "final chance"], "why_trending": "Momentum clarity improves completion."},
        {"name": "emotionally clear payoff", "description": "Ending resolves core emotional thread.", "signal_words": ["forgave", "chose", "promised", "ready", "finally"], "why_trending": "Catharsis and agency are recurring positive review factors."},
    ],
    avoid=[
        {"name": "adult voice in teen POV", "reason": "Inauthentic voice reduces YA fit.", "signal_words": ["boardroom diction", "overly formal teen"]},
        {"name": "grim stakes without warmth", "reason": "YA market still rewards hope and relational grounding.", "signal_words": ["hopeless forever", "no support"]},
        {"name": "filler school scenes", "reason": "Scene utility and momentum are expected.", "signal_words": ["just another class", "no consequence"]},
    ],
    notes="YA remains highly voice-sensitive in 2024-2025. Manuscripts with emotional clarity, strong momentum, and authentic age-voice are favored.",
    pacing="fast",
    formality="low",
)

TREND_DATABASE["childrens"] = _genre_pack(
    subgenres=[
        {"name": "Early Reader Adventure", "description": "Simple chaptered stories with clear episodic goals.", "growth": "stable", "signal_words": ["adventure", "map", "friend", "quest", "chapter"]},
        {"name": "STEM Storytelling", "description": "Science curiosity integrated with narrative.", "growth": "rising", "signal_words": ["experiment", "robot", "invent", "science fair", "discover"]},
        {"name": "SEL Fiction", "description": "Social-emotional skill growth through story conflict.", "growth": "rising", "signal_words": ["kindness", "share", "apologize", "feelings", "brave"]},
        {"name": "Magical School Story", "description": "Light fantasy in school/social context.", "growth": "stable", "signal_words": ["classroom", "teacher", "spell", "club", "school"]},
        {"name": "Interactive Humor Story", "description": "Reader-address and playful structure.", "growth": "stable", "signal_words": ["turn the page", "you", "draw", "choose", "again"]},
    ],
    hot=[
        {"name": "clear emotional lesson beat", "description": "Story contains understandable social-emotional growth.", "signal_words": ["learned", "helped", "shared", "sorry", "brave"], "why_trending": "Educator and parent demand remains high for SEL utility."},
        {"name": "friendship-team solution", "description": "Challenges solved collaboratively.", "signal_words": ["team", "friends", "together", "help", "we can"], "why_trending": "Collaborative framing supports classroom adoption."},
        {"name": "gentle humor", "description": "Playful tone without humiliation-based jokes.", "signal_words": ["giggle", "silly", "oops", "funny", "laugh"], "why_trending": "Positive humor increases reread value."},
        {"name": "read-aloud rhythm", "description": "Cadence supports oral reading flow.", "signal_words": ["again", "then", "and then", "finally", "suddenly"], "why_trending": "Read-aloud quality drives purchase decisions."},
        {"name": "safe suspense", "description": "Mild uncertainty resolved with reassurance.", "signal_words": ["uh-oh", "where is", "missing", "found", "safe"], "why_trending": "Engagement with age-appropriate tone performs best."},
    ],
    avoid=[
        {"name": "dense paragraph blocks", "reason": "Younger readers need visual and syntactic accessibility.", "signal_words": ["very long paragraph", "complex syntax"]},
        {"name": "abstract moralizing", "reason": "Concrete action-led lessons are better received.", "signal_words": ["the moral is", "children must"]},
        {"name": "fear-heavy imagery", "reason": "Age-fit sensitivity is a core gate in acquisition.", "signal_words": ["gore", "nightmare", "violent"]},
    ],
    notes="Children's writing trends favor clarity, warmth, and rereadability. SEL-aligned themes and read-aloud cadence remain strong in current channels.",
    pacing="medium",
    formality="low",
)


class TrendMatcher:
    def __init__(self) -> None:
        self.db = TREND_DATABASE

    def analyze(self, genre: str, detected_props: Dict[str, Any], text: str) -> Dict[str, Any]:
        norm_genre = _normalize_genre(genre)
        trend = self.db.get(norm_genre)
        if not trend:
            return {
                "genre": norm_genre,
                "market_health": "stable",
                "matched_tropes": [],
                "missing_tropes": [],
                "avoid_warnings": [],
                "trending_subgenre": None,
                "alignment_score": 35,
                "alignment_breakdown": {
                    "trope_match": 0,
                    "pacing_match": 15,
                    "formality_match": 15,
                    "subgenre_match": 5,
                },
                "market_notes": "No market profile found for this genre label.",
                "recommendations": [
                    "Choose a specific target genre in Setup for richer trend alignment.",
                    "Add explicit trope signals in scenes to strengthen market positioning.",
                    "Tighten pacing consistency between adjacent paragraphs.",
                ],
                "hot_tropes": [],
                "trending_subgenres": [],
                "avoid_tropes": [],
            }

        text_l = (text or "").lower()
        tokens = _token_set(text_l)

        matched_tropes: List[Dict[str, Any]] = []
        missing_tropes: List[Dict[str, Any]] = []
        for trope in trend["hot_tropes"]:
            hits = [signal for signal in trope["signal_words"] if _contains_signal(text_l, tokens, signal)]
            item = {
                "name": trope["name"],
                "description": trope["description"],
                "why_trending": trope["why_trending"],
                "signal_words": trope["signal_words"],
                "signal_words_found": hits,
            }
            if hits:
                matched_tropes.append(item)
            else:
                missing_tropes.append(item)

        avoid_warnings: List[Dict[str, Any]] = []
        for avoid in trend["avoid_tropes"]:
            hits = [signal for signal in avoid.get("signal_words", []) if _contains_signal(text_l, tokens, signal)]
            if hits:
                avoid_warnings.append({
                    "name": avoid["name"],
                    "reason": avoid["reason"],
                    "signal_words_found": hits,
                })

        best_subgenre = None
        best_hits = -1
        for sub in trend["trending_subgenres"]:
            score = sum(1 for signal in sub["signal_words"] if _contains_signal(text_l, tokens, signal))
            if score > best_hits:
                best_hits = score
                best_subgenre = {
                    **sub,
                    "signal_words_found": [signal for signal in sub["signal_words"] if _contains_signal(text_l, tokens, signal)],
                }

        actual_pacing = _pace_bucket(detected_props.get("pacing_label"))
        expected_pacing = str(trend.get("pacing_expectation", "medium")).lower()
        pacing_match_score = 20 if actual_pacing == expected_pacing else 15

        readability = float(detected_props.get("readability_score", 60) or 60)
        avg_sentence_len = float(detected_props.get("avg_sentence_len", 18) or 18)
        actual_formality = _formality_bucket(readability, avg_sentence_len)
        expected_formality = str(trend.get("formality_expectation", "medium")).lower()
        formality_match_score = 20 if actual_formality == expected_formality else 15

        trope_match_score = int(round((len(matched_tropes) / max(len(trend["hot_tropes"]), 1)) * 40))
        subgenre_match_score = 20 if best_subgenre and best_hits > 0 else 15

        breakdown = {
            "trope_match": trope_match_score,
            "pacing_match": pacing_match_score,
            "formality_match": formality_match_score,
            "subgenre_match": subgenre_match_score,
        }
        alignment_score = int(max(0, min(100, sum(breakdown.values()))))

        recommendations = self._recommend(
            trend=trend,
            matched_tropes=matched_tropes,
            missing_tropes=missing_tropes,
            avoid_warnings=avoid_warnings,
            subgenre=best_subgenre,
            actual_pacing=actual_pacing,
            actual_formality=actual_formality,
            detected_props=detected_props,
        )

        return {
            "genre": norm_genre,
            "market_health": self._health_label(trend["trending_subgenres"]),
            "matched_tropes": matched_tropes,
            "missing_tropes": missing_tropes,
            "avoid_warnings": avoid_warnings,
            "trending_subgenre": best_subgenre,
            "alignment_score": alignment_score,
            "alignment_breakdown": breakdown,
            "market_notes": trend["market_notes"],
            "recommendations": recommendations,
            "hot_tropes": trend["hot_tropes"],
            "trending_subgenres": trend["trending_subgenres"],
            "avoid_tropes": trend["avoid_tropes"],
            "detected_props": {
                **detected_props,
                "pacing_bucket": actual_pacing,
                "formality_bucket": actual_formality,
            },
        }

    def _health_label(self, subgenres: List[Dict[str, Any]]) -> str:
        rising = sum(1 for item in subgenres if item.get("growth") == "rising")
        declining = sum(1 for item in subgenres if item.get("growth") == "declining")
        if rising - declining >= 2:
            return "rising"
        if declining > rising:
            return "declining"
        return "stable"

    def _recommend(
        self,
        trend: Dict[str, Any],
        matched_tropes: List[Dict[str, Any]],
        missing_tropes: List[Dict[str, Any]],
        avoid_warnings: List[Dict[str, Any]],
        subgenre: Dict[str, Any] | None,
        actual_pacing: str,
        actual_formality: str,
        detected_props: Dict[str, Any],
    ) -> List[str]:
        recs: List[str] = []

        if missing_tropes:
            recs.append(
                f"Add one concrete signal for '{missing_tropes[0]['name']}' to lift trope alignment without forcing plot changes."
            )
        if subgenre and subgenre.get("signal_words_found"):
            cues = ", ".join(subgenre["signal_words_found"][:3])
            recs.append(f"Reinforce your detected sub-genre '{subgenre['name']}' by repeating cues like: {cues}.")
        else:
            recs.append("Strengthen sub-genre identity by repeating setting and conflict motifs across multiple paragraphs.")
        if actual_pacing != trend["pacing_expectation"]:
            recs.append(
                f"Adjust pacing toward '{trend['pacing_expectation']}' for stronger market fit in this genre."
            )
        if actual_formality != trend["formality_expectation"]:
            recs.append(
                f"Shift language register toward '{trend['formality_expectation']}' formality for this audience segment."
            )
        if avoid_warnings:
            recs.append(
                f"Revise detected risk pattern '{avoid_warnings[0]['name']}' to avoid common rejection triggers."
            )
        if float(detected_props.get("dialogue_count", 0) or 0) <= 1:
            recs.append("Increase purposeful dialogue beats to improve character immediacy and readability.")
        if len(matched_tropes) >= 3:
            recs.append(
                "Your trope coverage is already strong; prioritize execution quality and voice distinctiveness."
            )

        out: List[str] = []
        seen = set()
        for rec in recs:
            key = rec.lower()
            if key not in seen:
                out.append(rec)
                seen.add(key)
        if len(out) < 3:
            out.append("Add clear chapter-level micro-goals so each scene advances plot, character, or both.")
        return out[:5]


def match_trends(
    genre: str,
    text: str,
    pacing_rows: List[Dict[str, Any]] | None = None,
    genre_rows: List[Dict[str, Any]] | None = None,
    dialogue_profiles: Dict[str, Any] | None = None,
    context: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    pacing_rows = pacing_rows or []
    detected_props = {
        "pacing_label": pacing_rows[-1].get("label") if pacing_rows else "Moderate",
        "dominant_genre": genre or "unknown",
        "readability_score": 60,
        "show_tell_count": 0,
        "avg_sentence_len": 18,
        "dialogue_count": len((dialogue_profiles or {}).keys()),
    }
    requested_genre = genre
    if isinstance(context, dict) and context.get("genre"):
        requested_genre = context.get("genre")
    return TrendMatcher().analyze(str(requested_genre or genre or "unknown"), detected_props, text)
