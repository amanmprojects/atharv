"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: genre_detector.py - Genre identification + drift detection
 
Detects the dominant genre of a text and alerts when it starts shifting.
Uses keyword-weighted scoring per paragraph — no external APIs needed.
 
Genres supported:
  thriller, romance, comedy, literary, horror, mystery, fantasy, journalistic
"""
 
import re
from collections import Counter
 
 
GENRE_SIGNALS = {
    'thriller': {
        'keywords': [
            'danger', 'escape', 'chase', 'weapon', 'threat', 'kill', 'spy',
            'mission', 'explosive', 'target', 'assassin', 'bomb', 'agent',
            'surveillance', 'betrayal', 'hostage', 'gunshot', 'ambush'
        ],
        'tone_words': ['tense', 'urgent', 'desperate', 'frantic', 'relentless'],
        'color'     : '#ef4444'
    },
    'romance': {
        'keywords': [
            'love', 'heart', 'kiss', 'embrace', 'longing', 'passion',
            'darling', 'tender', 'whisper', 'desire', 'affection', 'soulmate',
            'together', 'forever', 'adore', 'cherish', 'beloved', 'attraction'
        ],
        'tone_words': ['warm', 'gentle', 'sweet', 'tender', 'loving'],
        'color'     : '#f472b6'
    },
    'comedy': {
        'keywords': [
            'laugh', 'joke', 'ridiculous', 'absurd', 'funny', 'hilarious',
            'silly', 'clumsy', 'awkward', 'bumble', 'mishap', 'chaos',
            'disaster', 'blunder', 'goof', 'prank', 'slapstick', 'wit'
        ],
        'tone_words': ['playful', 'light', 'whimsical', 'breezy', 'irreverent'],
        'color'     : '#fbbf24'
    },
    'horror': {
        'keywords': [
            'dark', 'shadow', 'blood', 'scream', 'monster', 'haunted',
            'terror', 'dread', 'nightmare', 'creature', 'evil', 'cursed',
            'death', 'corpse', 'ghost', 'demon', 'shriek', 'crawl'
        ],
        'tone_words': ['sinister', 'eerie', 'ominous', 'chilling', 'macabre'],
        'color'     : '#7c3aed'
    },
    'mystery': {
        'keywords': [
            'clue', 'suspect', 'detective', 'investigate', 'evidence',
            'witness', 'crime', 'motive', 'alibi', 'case', 'puzzle',
            'reveal', 'secret', 'hidden', 'discover', 'trail', 'deception'
        ],
        'tone_words': ['cryptic', 'suspicious', 'puzzling', 'ambiguous', 'elusive'],
        'color'     : '#0891b2'
    },
    'literary': {
        'keywords': [
            'reflect', 'memory', 'consciousness', 'identity', 'meaning',
            'existence', 'metaphor', 'symbol', 'introspection', 'solitude',
            'belonging', 'nostalgia', 'humanity', 'perception', 'truth'
        ],
        'tone_words': ['contemplative', 'nuanced', 'introspective', 'lyrical', 'profound'],
        'color'     : '#10b981'
    },
    'fantasy': {
        'keywords': [
            'magic', 'dragon', 'kingdom', 'spell', 'sword', 'wizard',
            'enchanted', 'quest', 'prophecy', 'ancient', 'mythical',
            'creature', 'realm', 'portal', 'rune', 'sorcerer', 'legend'
        ],
        'tone_words': ['epic', 'mystical', 'otherworldly', 'legendary', 'arcane'],
        'color'     : '#8b5cf6'
    },
    'journalistic': {
        'keywords': [
            'report', 'source', 'official', 'statement', 'according',
            'confirmed', 'investigation', 'policy', 'government', 'data',
            'percent', 'statistics', 'spokesperson', 'announced', 'issued'
        ],
        'tone_words': ['objective', 'factual', 'neutral', 'precise', 'direct'],
        'color'     : '#64748b'
    }
}
 
 
class GenreDetector:
    """
    Detects genre per paragraph and tracks drift over the document.
    """
 
    def score_paragraph(self, paragraph):
        """Score a paragraph against all genre keyword sets."""
        words     = re.findall(r'\b\w+\b', paragraph.lower())
        word_set  = set(words)
        scores    = {}
 
        for genre, signals in GENRE_SIGNALS.items():
            kw_hits   = sum(1 for kw in signals['keywords']   if kw in word_set)
            tone_hits = sum(1 for tw in signals['tone_words'] if tw in word_set)
            scores[genre] = kw_hits * 1.0 + tone_hits * 0.5
 
        return scores
 
    def analyze(self, text):
        """
        Analyze genre distribution across the full document.
 
        Returns:
            - dominant_genre: overall genre of the text
            - per_paragraph: genre scores per paragraph
            - drift_issues: paragraphs where genre significantly shifts
            - genre_curve: for visualization (genre score per paragraph)
        """
        paragraphs     = [p.strip() for p in text.split('\n\n') if p.strip()]
        per_paragraph  = []
        drift_issues   = []
 
        for i, para in enumerate(paragraphs):
            scores  = self.score_paragraph(para)
            total   = sum(scores.values())
            if total == 0:
                top_genre = 'neutral'
                confidence= 0
            else:
                top_genre  = max(scores, key=scores.get)
                confidence = scores[top_genre] / total
 
            per_paragraph.append({
                'paragraph' : i + 1,
                'top_genre' : top_genre,
                'confidence': round(confidence, 3),
                'scores'    : {g: round(s, 2) for g, s in scores.items()},
                'color'     : GENRE_SIGNALS.get(top_genre, {}).get('color', '#64748b')
            })
 
        # Overall dominant genre (majority vote weighted by confidence)
        genre_votes = Counter()
        for p in per_paragraph:
            if p['top_genre'] != 'neutral':
                genre_votes[p['top_genre']] += p['confidence']
 
        dominant_genre = genre_votes.most_common(1)[0][0] if genre_votes else 'unknown'
 
        # Detect genre drift: paragraph genre differs from dominant
        for p in per_paragraph:
            if (p['top_genre'] != dominant_genre
                    and p['top_genre'] != 'neutral'
                    and p['confidence'] > 0.4):
                drift_issues.append({
                    'type'      : 'genre_drift',
                    'category'  : 'Genre',
                    'message'   : f"🎭 Paragraph {p['paragraph']} reads as {p['top_genre'].upper()} "
                                  f"(document is primarily {dominant_genre.upper()})",
                    'suggestion': f"Review paragraph {p['paragraph']} — it may unintentionally shift your story's tone",
                    'severity'  : 'low',
                    'paragraph' : p['paragraph'],
                    'detected'  : p['top_genre'],
                    'expected'  : dominant_genre
                })
 
        # Genre curve: top-N scores per paragraph for visualization
        genres_to_show = list(genre_votes.most_common(4))
        genre_curve    = []
        for p in per_paragraph:
            entry = {'paragraph': p['paragraph']}
            for g, _ in genres_to_show:
                entry[g] = p['scores'].get(g, 0)
            genre_curve.append(entry)
 
        return {
            'dominant_genre': dominant_genre,
            'genre_color'   : GENRE_SIGNALS.get(dominant_genre, {}).get('color', '#64748b'),
            'per_paragraph' : per_paragraph,
            'drift_issues'  : drift_issues,
            'genre_curve'   : genre_curve,
            'top_genres'    : [g for g, _ in genre_votes.most_common(4)]
        }
