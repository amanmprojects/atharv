"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: text_analyzer.py - Structure, pacing, and writing quality analysis
"""
 
import re
from collections import Counter

try:
    import spacy
except ImportError:
    spacy = None

if spacy is not None:
    try:
        _nlp = spacy.load("en_core_web_sm")
    except OSError:
        _nlp = None
else:
    _nlp = None
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  STRUCTURE ANALYZER
# ─────────────────────────────────────────────────────────────────────────────
 
class StructureAnalyzer:
    """
    Analyzes text structure for:
    - Passive voice usage
    - Sentence length variance
    - Paragraph length distribution
    - Transition word presence
    - Readability scoring (Flesch-Kincaid approximation)
    """
 
    TRANSITION_WORDS = {
        'however', 'therefore', 'furthermore', 'meanwhile', 'consequently',
        'additionally', 'nevertheless', 'subsequently', 'conversely', 'thus',
        'moreover', 'nonetheless', 'accordingly', 'otherwise', 'finally'
    }
 
    PASSIVE_PATTERNS = [
        r'\b(was|were|is|are|been|being)\s+\w+ed\b',
        r'\b(was|were)\s+\w+en\b',
    ]
 
    def analyze(self, text, nlp=None):
        """
        Full structure analysis of text.
 
        Returns:
            dict with issues list, scores, and suggestions
        """
        paragraphs  = [p.strip() for p in text.split('\n\n') if p.strip()]
        sentences   = self._split_sentences(text)
        issues      = []
        suggestions = []
 
        # ── Passive voice check ──────────────────────────────
        for i, sentence in enumerate(sentences):
            for pattern in self.PASSIVE_PATTERNS:
                if re.search(pattern, sentence, re.IGNORECASE):
                    issues.append({
                        'category'  : 'Clarity',
                        'sentence'  : sentence.strip(),
                        'issue'     : 'Passive voice detected',
                        'suggestion': 'Consider rewriting in active voice for stronger impact',
                        'severity'  : 'low'
                    })
                    break
 
        # ── Sentence length variance ─────────────────────────
        lengths = [len(s.split()) for s in sentences if s.strip()]
        if lengths:
            avg_len = sum(lengths) / len(lengths)
            variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
 
            if variance < 5:
                suggestions.append({
                    'category'  : 'Flow',
                    'message'   : 'Sentence lengths are very uniform — vary them for better rhythm',
                    'severity'  : 'medium'
                })
 
            # Flag very long sentences
            for i, sentence in enumerate(sentences):
                word_count = len(sentence.split())
                if word_count > 45:
                    issues.append({
                        'category'  : 'Clarity',
                        'sentence'  : sentence.strip()[:120] + '...',
                        'issue'     : f'Very long sentence ({word_count} words)',
                        'suggestion': 'Consider splitting into 2 shorter sentences',
                        'severity'  : 'medium'
                    })
                elif word_count < 4 and word_count > 0:
                    issues.append({
                        'category'  : 'Structure',
                        'sentence'  : sentence.strip(),
                        'issue'     : 'Very short sentence — may be a fragment',
                        'suggestion': 'Check if this is intentional or a fragment',
                        'severity'  : 'low'
                    })
 
        # ── Transition word check ────────────────────────────
        para_starts = [p.split()[0].lower() if p.split() else '' for p in paragraphs]
        transitions_found = sum(1 for w in para_starts if w in self.TRANSITION_WORDS)
        if len(paragraphs) > 3 and transitions_found == 0:
            suggestions.append({
                'category': 'Flow',
                'message' : 'No transition words found between paragraphs — consider adding connectors',
                'severity': 'low'
            })
 
        # ── Readability score (Flesch-Kincaid approximation) ──
        words     = text.split()
        syllables = sum(self._count_syllables(w) for w in words)
        num_sentences = max(len(sentences), 1)
        num_words     = max(len(words), 1)
 
        fk_score = 206.835 - 1.015 * (num_words / num_sentences) - 84.6 * (syllables / num_words)
        fk_score = max(0, min(100, fk_score))
 
        return {
            'issues'            : issues,
            'suggestions'       : suggestions,
            'readability_score' : round(fk_score, 1),
            'avg_sentence_len'  : round(avg_len, 1) if lengths else 0,
            'num_sentences'     : len(sentences),
            'num_paragraphs'    : len(paragraphs),
            'total_words'       : num_words
        }
 
    def _split_sentences(self, text):
        return re.split(r'(?<=[.!?])\s+', text)
 
    def _count_syllables(self, word):
        word = word.lower().strip(".,!?;:")
        if len(word) <= 3:
            return 1
        count = len(re.findall(r'[aeiou]+', word))
        if word.endswith('e'):
            count -= 1
        return max(1, count)
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  SHOW DON'T TELL DETECTOR
# ─────────────────────────────────────────────────────────────────────────────
 
class ShowDontTellDetector:
    """
    Detects 'telling' sentences and suggests 'showing' alternatives.
    
    Telling: "She was very angry."
    Showing: "Her hands shook as she slammed the door."
    """
 
    TELLING_PATTERNS = {
        'angry'   : ['was angry', 'was furious', 'felt angry', 'very angry', 'was mad'],
        'sad'     : ['was sad', 'felt sad', 'was unhappy', 'very sad', 'felt depressed'],
        'happy'   : ['was happy', 'felt happy', 'was excited', 'very happy', 'was pleased'],
        'scared'  : ['was scared', 'felt scared', 'was afraid', 'very scared', 'was terrified'],
        'nervous' : ['was nervous', 'felt nervous', 'was anxious', 'very nervous'],
        'tired'   : ['was tired', 'felt tired', 'was exhausted', 'very tired'],
    }
 
    SHOWING_SUGGESTIONS = {
        'angry'   : 'Show anger through physical actions: clenched fists, raised voice, slamming objects',
        'sad'     : 'Show sadness through body language: slumped shoulders, averted gaze, trembling lip',
        'happy'   : 'Show happiness through actions: wide smile, quick movements, bright eyes',
        'scared'  : 'Show fear through physical response: dry mouth, pounding heart, frozen in place',
        'nervous' : 'Show nerves through behavior: fidgeting, stuttering, avoiding eye contact',
        'tired'   : 'Show tiredness: heavy eyelids, slow movements, difficulty concentrating',
    }
 
    def analyze(self, text, policy="standard"):
        sentences = re.split(r'(?<=[.!?])\s+', text)
        issues    = []
        policy    = str(policy or "standard").lower()
 
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for emotion, patterns in self.TELLING_PATTERNS.items():
                for pattern in patterns:
                    if pattern in sentence_lower:
                        severity = 'medium'
                        if policy == 'lenient':
                            severity = 'low'
                        elif policy == 'strict' and 'very ' in sentence_lower:
                            severity = 'high'
                        issues.append({
                            'category'  : 'Show Don\'t Tell',
                            'sentence'  : sentence.strip(),
                            'issue'     : f'Telling the reader the character is {emotion}',
                            'suggestion': self.SHOWING_SUGGESTIONS[emotion],
                            'severity'  : severity,
                            'emotion'   : emotion
                        })
                        break
 
        return issues
 
 
# ─────────────────────────────────────────────────────────────────────────────
#  PACING ANALYZER
# ─────────────────────────────────────────────────────────────────────────────
 
class PacingAnalyzer:
    """
    Analyzes narrative pacing by measuring action density and 
    emotional intensity per paragraph.
    
    Returns a pacing curve that shows where story is fast/slow.
    
    Uses spaCy for lemmatization when available, enabling detection
    of conjugated forms (running, runs -> run).
    """

    ACTION_LEMMAS = {
        'run', 'jump', 'grab', 'fight', 'scream', 'rush', 'sprint',
        'attack', 'escape', 'chase', 'fire', 'strike', 'crash', 'explode',
        'fall', 'dodge', 'throw', 'hit', 'push', 'pull', 'slam', 'burst',
        'kick', 'punch', 'leap', 'dive', 'charge', 'flee', 'hunt',
        'climb', 'swing', 'slash', 'shoot', 'punch', 'bite', 'tear',
        'smash', 'break', 'shatter', 'rip', 'tear', 'spin', 'twist',
        'dash', 'bolt', 'race', 'hurry', 'scramble', 'struggle',
        'battle', 'wrestle', 'grapple', 'seize', 'snatch', 'catch'
    }

    EMOTION_LEMMAS = {
        'high' : ['terrify', 'ecstatic', 'furious', 'desperate', 'anguish',
                  'thrill', 'horrify', 'elate', 'devastate', 'enrage',
                  'panic', 'terror', 'rage', 'fury', 'horror', 'ecstasy',
                  'frenzy', 'hysteria', 'shock', 'trauma'],
        'medium': ['worry', 'excite', 'nervous', 'please', 'annoy',
                   'surprise', 'concern', 'hope', 'uneasy', 'proud',
                   'anxious', 'tense', 'suspense', 'dread', 'eager',
                   'restless', 'alert', 'anticipate', 'curious'],
        'low'  : ['calm', 'peaceful', 'quiet', 'still', 'relax', 'content',
                   'bore', 'neutral', 'steady', 'gentle', 'serene',
                   'tranquil', 'soothe', 'mellow', 'lazy', 'drowsy']
    }

    IRREGULAR_VERBS = {
        'ran': 'run', 'runs': 'run', 'running': 'run',
        'fought': 'fight', 'fighting': 'fight',
        'fell': 'fall', 'falls': 'fall', 'falling': 'fall',
        'threw': 'throw', 'throws': 'throw', 'throwing': 'throw',
        'struck': 'strike', 'strikes': 'strike', 'striking': 'strike',
        'caught': 'catch', 'catches': 'catch', 'catching': 'catch',
        'fled': 'flee', 'flees': 'flee', 'fleeing': 'flee',
        'shot': 'shoot', 'shoots': 'shoot', 'shooting': 'shoot',
        'bit': 'bite', 'bites': 'bite', 'biting': 'bite',
        'tore': 'tear', 'tears': 'tear', 'tearing': 'tear',
        'broke': 'break', 'breaks': 'break', 'breaking': 'break',
        'leapt': 'leap', 'leaped': 'leap', 'leaps': 'leap', 'leaping': 'leap',
        'dove': 'dive', 'dived': 'dive', 'dives': 'dive', 'diving': 'dive',
        'terrified': 'terrify', 'terrifies': 'terrify', 'terrifying': 'terrify',
        'horrified': 'horrify', 'horrifies': 'horrify', 'horrifying': 'horrify',
        'thrilled': 'thrill', 'thrills': 'thrill', 'thrilling': 'thrill',
        'elated': 'elate', 'elates': 'elate', 'elating': 'elate',
        'devastated': 'devastate', 'devastates': 'devastate', 'devastating': 'devastate',
        'enraged': 'enrage', 'enrages': 'enrage', 'enraging': 'enrage',
        'worried': 'worry', 'worries': 'worry', 'worrying': 'worry',
        'excited': 'excite', 'excites': 'excite', 'exciting': 'excite',
        'pleased': 'please', 'pleases': 'please', 'pleasing': 'please',
        'annoyed': 'annoy', 'annoys': 'annoy', 'annoying': 'annoy',
        'surprised': 'surprise', 'surprises': 'surprise', 'surprising': 'surprise',
        'bored': 'bore', 'bores': 'bore', 'boring': 'bore',
        'relaxed': 'relax', 'relaxes': 'relax', 'relaxing': 'relax',
    }

    def analyze(self, text, target_band=None):
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        pacing_data = []

        for i, para in enumerate(paragraphs):
            if _nlp is not None:
                action_score, emotion_score = self._analyze_with_spacy(para)
            else:
                action_score, emotion_score = self._analyze_fallback(para)

            combined = (action_score * 0.6 + emotion_score * 0.4)

            pacing_data.append({
                'paragraph'    : i + 1,
                'action_score' : round(action_score, 2),
                'emotion_score': round(emotion_score, 2),
                'pacing_score' : round(combined, 2),
                'label'        : self._pace_label(combined)
            })

        suggestions = self._generate_pacing_suggestions(pacing_data, target_band=target_band)

        return {'pacing': pacing_data, 'suggestions': suggestions}

    def _analyze_with_spacy(self, paragraph):
        doc = _nlp(paragraph)
        
        action_count = 0
        emotion_score = 0

        for token in doc:
            lemma = token.lemma_.lower()
            
            if lemma in self.ACTION_LEMMAS:
                action_count += 1
            
            if lemma in self.EMOTION_LEMMAS['high']:
                emotion_score += 3
            elif lemma in self.EMOTION_LEMMAS['medium']:
                emotion_score += 1.5
            elif lemma in self.EMOTION_LEMMAS['low']:
                emotion_score += 0.5

        action_score = min(10, action_count * 2)
        emotion_score = min(10, emotion_score)

        return action_score, emotion_score

    def _analyze_fallback(self, paragraph):
        words = paragraph.lower().split()
        
        action_count = 0
        emotion_score = 0

        for word in words:
            clean_word = re.sub(r'[^\w]', '', word)
            
            lemma = self.IRREGULAR_VERBS.get(clean_word, clean_word)
            
            if lemma in self.ACTION_LEMMAS:
                action_count += 1
                continue
            
            if self._word_matches_lemma(lemma, self.ACTION_LEMMAS):
                action_count += 1

            for level, lemmas in self.EMOTION_LEMMAS.items():
                if lemma in lemmas:
                    if level == 'high':
                        emotion_score += 3
                    elif level == 'medium':
                        emotion_score += 1.5
                    else:
                        emotion_score += 0.5
                    break
                elif self._word_matches_lemma(lemma, lemmas):
                    if level == 'high':
                        emotion_score += 3
                    elif level == 'medium':
                        emotion_score += 1.5
                    else:
                        emotion_score += 0.5
                    break

        action_score = min(10, action_count * 2)
        emotion_score = min(10, emotion_score)

        return action_score, emotion_score

    def _word_matches_lemma(self, word, lemma_set):
        if isinstance(lemma_set, set):
            for lemma in lemma_set:
                if word == lemma:
                    return True
                if word.startswith(lemma) and len(word) - len(lemma) <= 3:
                    suffix = word[len(lemma):]
                    if suffix in ('', 's', 'ed', 'ing', 'er', 'est', 'ly', 'd'):
                        return True
            return False
        return word == lemma_set
 
    def _pace_label(self, score):
        if score >= 7:   return '🔴 High Tension'
        elif score >= 4: return '🟡 Moderate'
        else:            return '🟢 Slow / Reflective'
 
    def _generate_pacing_suggestions(self, pacing_data, target_band=None):
        suggestions = []
        scores = [p['pacing_score'] for p in pacing_data]
 
        # Detect long slow stretches
        slow_streak = 0
        for i, score in enumerate(scores):
            if score < 3:
                slow_streak += 1
                if slow_streak >= 3:
                    suggestions.append({
                        'type'      : 'Pacing',
                        'message'   : f'Paragraphs {i-1} to {i+1} feel slow — consider adding action or tension',
                        'severity'  : 'medium'
                    })
            else:
                slow_streak = 0
 
        # Detect abrupt pace jumps
        for i in range(1, len(scores)):
            if abs(scores[i] - scores[i-1]) > 6:
                suggestions.append({
                    'type'    : 'Pacing',
                    'message' : f'Abrupt pace change between paragraphs {i} and {i+1} — consider a transition',
                    'severity': 'low'
                })
 
        if target_band and scores:
            min_target = float(target_band.get('min', 4.2))
            max_target = float(target_band.get('max', 6.8))
            label = target_band.get('label', 'balanced')
            avg_score = sum(scores) / max(len(scores), 1)
            if avg_score < min_target:
                suggestions.append({
                    'type'    : 'Pacing',
                    'message' : (
                        f'Average pacing {avg_score:.2f} is below your target for a {label} profile '
                        f'({min_target:.1f}-{max_target:.1f}).'
                    ),
                    'severity': 'medium'
                })
            elif avg_score > max_target:
                suggestions.append({
                    'type'    : 'Pacing',
                    'message' : (
                        f'Average pacing {avg_score:.2f} is above your target band '
                        f'({min_target:.1f}-{max_target:.1f}) and may feel rushed.'
                    ),
                    'severity': 'low'
                })

        return suggestions
