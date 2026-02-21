"""
Deep Analysis Engine — The Core Suggestion Generator
Catches: grammar issues, tense inconsistency, contradictions (adjective/emotion/logic),
redundancy, pacing problems, weak verbs, adverb overuse, and generates actionable rewrites.
"""

import re
from typing import List, Dict, Tuple, Optional
from collections import Counter


class DeepAnalysisEngine:
    def __init__(self):
        # ── Grammar Rules ──
        self.subject_verb_patterns = [
            (r'\b(he|she|it)\s+(are|were|have)\b', 'subject_verb_agreement',
             'Subject-verb disagreement: singular subject with plural verb'),
            (r'\b(they|we)\s+(is|was|has)\b', 'subject_verb_agreement',
             'Subject-verb disagreement: plural subject with singular verb'),
            (r'\b(I)\s+(is|was not|were)\b', 'subject_verb_agreement',
             'Subject-verb disagreement with "I"'),
        ]

        self.common_grammar_errors = [
            (r'\b(could of|would of|should of|must of)\b', 'grammar_modal',
             'Use "could have" instead of "could of"',
             lambda m: m.group(0).replace(' of', ' have')),
            (r'\b(their)\s+(is|was|are|were)\b', 'grammar_there',
             'Did you mean "there" (not "their") before a verb?', None),
            (r'\b(your)\s+(a|an|the|going|doing|being|very)\b', 'grammar_youre',
             'Did you mean "you\'re" (you are)?', None),
            (r'\b(its)\s+(a|an|the|going|doing|being|very)\b', 'grammar_its',
             'Did you mean "it\'s" (it is)?', None),
            (r'\b(alot)\b', 'grammar_alot',
             'Should be "a lot" (two words)',
             lambda m: 'a lot'),
            (r'\b(irregardless)\b', 'grammar_irregardless',
             '"Irregardless" is non-standard; use "regardless"',
             lambda m: 'regardless'),
            (r'\b(supposably)\b', 'grammar_supposably',
             'Did you mean "supposedly"?',
             lambda m: 'supposedly'),
            (r'\bthat she never (seen|went|did|ran|spoke)\b', 'grammar_past_participle',
             'Use past participle after "never": "had seen", "had gone"',
             None),
        ]

        # ── Tense Consistency ──
        self.past_tense_indicators = [
            r'\b(was|were|had|did|went|ran|said|told|came|saw|knew|thought|felt|began|stood)\b'
        ]
        self.present_tense_indicators = [
            r'\b(is|are|has|does|goes|runs|says|tells|comes|sees|knows|thinks|feels|begins|stands)\b'
        ]

        # ── Contradictory Adjectives ──
        self.contradictory_pairs = [
            ('bright', 'dark'), ('silent', 'loud'), ('silent', 'echoing'),
            ('quiet', 'noisy'), ('empty', 'crowded'), ('abandoned', 'crowded'),
            ('brave', 'terrified'), ('calm', 'furious'), ('calm', 'angry'),
            ('happy', 'sad'), ('hot', 'cold'), ('wet', 'dry'),
            ('fast', 'slow'), ('tall', 'short'), ('big', 'small'),
            ('soft', 'loud'), ('softly', 'loudly'), ('silent', 'crowded'),
            ('open', 'closed'), ('alive', 'dead'), ('old', 'young'),
            ('clean', 'dirty'), ('light', 'heavy'), ('rich', 'poor'),
            ('strong', 'weak'), ('thin', 'thick'), ('wide', 'narrow'),
            ('raining', 'not raining'), ('intense', 'slow'),
        ]

        # ── Emotional Contradiction Patterns ──
        self.emotion_groups = {
            'fear': ['terrified', 'scared', 'afraid', 'frightened', 'fearful', 'anxious', 'panicked'],
            'courage': ['brave', 'courageous', 'bold', 'fearless', 'daring', 'valiant'],
            'calm': ['calm', 'serene', 'peaceful', 'relaxed', 'tranquil', 'composed'],
            'anger': ['furious', 'angry', 'enraged', 'livid', 'outraged', 'irate', 'incensed'],
            'joy': ['happy', 'joyful', 'delighted', 'elated', 'ecstatic', 'cheerful'],
            'sadness': ['sad', 'sorrowful', 'melancholy', 'depressed', 'grief', 'miserable'],
        }
        self.conflicting_emotions = [
            ('fear', 'courage'), ('calm', 'anger'), ('calm', 'fear'),
            ('joy', 'sadness'), ('courage', 'fear'),
        ]

        # ── Weak Verbs ──
        self.weak_verbs = {
            'went': ['hurried', 'strode', 'marched', 'dashed', 'wandered'],
            'said': ['whispered', 'declared', 'exclaimed', 'murmured', 'insisted'],
            'walked': ['strolled', 'trudged', 'ambled', 'sauntered', 'marched'],
            'looked': ['gazed', 'glanced', 'peered', 'stared', 'examined'],
            'got': ['obtained', 'acquired', 'received', 'earned', 'fetched'],
            'was': [],  # only flag in excess
            'had': [],
            'made': ['crafted', 'constructed', 'fashioned', 'created', 'forged'],
            'came': ['arrived', 'emerged', 'appeared', 'approached', 'entered'],
            'ran': ['sprinted', 'dashed', 'bolted', 'rushed', 'raced'],
        }

        # ── Pacing Patterns ──
        self.description_markers = [
            r'\bthe\s+color\s+of\b', r'\bthe\s+shape\s+of\b',
            r'\bthe\s+sound\s+of\b', r'\bthe\s+smell\s+of\b',
            r'\bwas\s+(?:made|decorated|painted|covered|surrounded)\b',
            r'\b(?:long|elaborate|detailed)\s+description\b',
        ]
        self.action_verbs = [
            'run', 'ran', 'running', 'fight', 'fighting', 'fought',
            'chase', 'chased', 'escape', 'escaped', 'flee', 'fled',
            'rush', 'rushed', 'hurry', 'hurried', 'sprint', 'sprinted',
            'attack', 'attacked', 'danger', 'emergency', 'urgent',
        ]

        # ── Redundancy Phrases ──
        self.redundancy_phrases = [
            (r'\b(again and again)\b', 'Use "repeatedly" instead of "again and again"'),
            (r'\b(each and every)\b', 'Use "each" or "every", not both'),
            (r'\b(first and foremost)\b', 'Use "first" or "foremost", not both'),
            (r'\b(if and when)\b', 'Choose "if" or "when"'),
            (r'\b(in different words)\b', 'This signals repetition — rewrite or remove'),
            (r'\b(described\s+repeatedly)\b', 'Remove redundant re-description'),
            (r'\b(over and over)\b', 'Use "repeatedly" instead'),
            (r'\b(completely\s+destroyed|totally\s+destroyed)\b', '"Destroyed" is already absolute'),
            (r'\b(very\s+unique)\b', '"Unique" is absolute — remove "very"'),
            (r'\b(absolutely\s+essential)\b', '"Essential" is already absolute'),
            (r'\b(past\s+history)\b', 'History is always past — use "history"'),
            (r'\b(free\s+gift)\b', 'A gift is free — just say "gift"'),
            (r'\b(end\s+result)\b', 'A result is at the end — just say "result"'),
        ]

        # ── Adverb overuse ──
        self.adverb_pattern = re.compile(r'\b(\w+ly)\b')

        # ── Unexplained transitions ──
        self.abrupt_location_shifts = [
            r'(?:suddenly|then|now)\s+(?:they\s+(?:were|are)\s+in|he\s+(?:was|is)\s+in|she\s+(?:was|is)\s+in)',
            r'the\s+scene\s+(?:moves?|shifts?|changes?|cuts?)',
            r'without\s+(?:explanation|warning|transition|reason)',
        ]

    def analyze(self, text: str) -> Dict:
        sentences = self._split_sentences(text)
        paragraphs = self._split_paragraphs(text)
        suggestions = []

        # 1. Grammar checks
        suggestions.extend(self._check_grammar(text, sentences))

        # 2. Tense inconsistency
        suggestions.extend(self._check_tense_consistency(sentences))

        # 3. Contradictory adjectives / descriptions
        suggestions.extend(self._check_contradictions(sentences))

        # 4. Emotional conflicts
        suggestions.extend(self._check_emotional_conflicts(sentences))

        # 5. Weak verbs
        suggestions.extend(self._check_weak_verbs(sentences))

        # 6. Adverb overuse
        suggestions.extend(self._check_adverb_overuse(sentences))

        # 7. Redundancy phrases
        suggestions.extend(self._check_redundancy(text, sentences))

        # 8. Pacing issues
        suggestions.extend(self._check_pacing(sentences))

        # 9. Abrupt scene transitions
        suggestions.extend(self._check_abrupt_transitions(text, sentences))

        # 10. Run-on sentence detection
        suggestions.extend(self._check_run_on_sentences(sentences))

        return {
            "suggestions": suggestions,
            "stats": {
                "total_issues": len(suggestions),
                "by_category": self._count_by_category(suggestions),
            }
        }

    # ── 1. Grammar ──
    def _check_grammar(self, text: str, sentences: List[str]) -> List[dict]:
        results = []

        for sent_idx, sentence in enumerate(sentences):
            # Subject-verb agreement
            for pattern, rule, reason in self.subject_verb_patterns:
                match = re.search(pattern, sentence, re.IGNORECASE)
                if match:
                    results.append(self._make_suggestion(
                        original=sentence,
                        modified=self._fix_subject_verb(sentence, match),
                        rule=f'grammar.{rule}',
                        reason=reason,
                        severity='high',
                        confidence=0.9,
                        sentence_idx=sent_idx,
                    ))

            # Common grammar errors
            for pattern, rule, reason, fixer in self.common_grammar_errors:
                match = re.search(pattern, sentence, re.IGNORECASE)
                if match:
                    modified = sentence
                    if fixer:
                        modified = re.sub(pattern, fixer(match), sentence, count=1, flags=re.IGNORECASE)
                    results.append(self._make_suggestion(
                        original=sentence,
                        modified=modified,
                        rule=f'grammar.{rule}',
                        reason=reason,
                        severity='high',
                        confidence=0.85,
                        sentence_idx=sent_idx,
                    ))

        return results

    # ── 2. Tense Consistency ──
    def _check_tense_consistency(self, sentences: List[str]) -> List[dict]:
        results = []
        tense_map = []  # (index, 'past'|'present'|'mixed')

        for idx, sent in enumerate(sentences):
            past = len(re.findall(self.past_tense_indicators[0], sent, re.IGNORECASE))
            present = len(re.findall(self.present_tense_indicators[0], sent, re.IGNORECASE))

            if past > 0 and present > 0:
                tense_map.append((idx, 'mixed'))
            elif past > present:
                tense_map.append((idx, 'past'))
            elif present > past:
                tense_map.append((idx, 'present'))
            else:
                tense_map.append((idx, 'neutral'))

        # Detect mixed-tense sentences
        for idx, tense in tense_map:
            if tense == 'mixed':
                results.append(self._make_suggestion(
                    original=sentences[idx],
                    modified='',
                    rule='consistency.tense_shift',
                    reason=f'This sentence mixes past and present tense. Choose one tense and apply it consistently.',
                    severity='high',
                    confidence=0.85,
                    sentence_idx=idx,
                ))

        # Detect document-level tense shifts
        dominant_tense = 'past'
        tense_counts = Counter(t for _, t in tense_map if t in ('past', 'present'))
        if tense_counts:
            dominant_tense = tense_counts.most_common(1)[0][0]

        for idx, tense in tense_map:
            if tense != 'neutral' and tense != 'mixed' and tense != dominant_tense:
                results.append(self._make_suggestion(
                    original=sentences[idx],
                    modified='',
                    rule='consistency.tense_document',
                    reason=f'This sentence uses {tense} tense, but the document primarily uses {dominant_tense} tense. Consider aligning for consistency.',
                    severity='medium',
                    confidence=0.7,
                    sentence_idx=idx,
                ))

        return results

    # ── 3. Contradictory Adjectives ──
    def _check_contradictions(self, sentences: List[str]) -> List[dict]:
        results = []

        for idx, sentence in enumerate(sentences):
            words = set(re.findall(r'\b\w+\b', sentence.lower()))

            for word_a, word_b in self.contradictory_pairs:
                a_in = word_a.lower() in words or word_a.lower() in sentence.lower()
                b_in = word_b.lower() in words or word_b.lower() in sentence.lower()

                if a_in and b_in:
                    results.append(self._make_suggestion(
                        original=sentence,
                        modified='',
                        rule='logic.contradictory_description',
                        reason=f'Contradictory descriptions: "{word_a}" and "{word_b}" appear in the same sentence. This creates confusion — choose one or explain the contrast.',
                        severity='high',
                        confidence=0.9,
                        sentence_idx=idx,
                    ))

        return results

    # ── 4. Emotional Conflicts ──
    def _check_emotional_conflicts(self, sentences: List[str]) -> List[dict]:
        results = []

        for idx, sentence in enumerate(sentences):
            sent_lower = sentence.lower()
            found_groups = set()

            for group, keywords in self.emotion_groups.items():
                if any(kw in sent_lower for kw in keywords):
                    found_groups.add(group)

            for group_a, group_b in self.conflicting_emotions:
                if group_a in found_groups and group_b in found_groups:
                    emotions_a = [kw for kw in self.emotion_groups[group_a] if kw in sent_lower]
                    emotions_b = [kw for kw in self.emotion_groups[group_b] if kw in sent_lower]
                    results.append(self._make_suggestion(
                        original=sentence,
                        modified='',
                        rule='narrative.emotional_conflict',
                        reason=f'Conflicting emotions in one sentence: {", ".join(emotions_a)} ({group_a}) vs {", ".join(emotions_b)} ({group_b}). Characters can feel complex emotions, but this needs narrative justification.',
                        severity='medium',
                        confidence=0.85,
                        sentence_idx=idx,
                    ))

        return results

    # ── 5. Weak Verbs ──
    def _check_weak_verbs(self, sentences: List[str]) -> List[dict]:
        results = []
        weak_count = Counter()

        for idx, sentence in enumerate(sentences):
            words = re.findall(r'\b\w+\b', sentence.lower())
            for word in words:
                if word in self.weak_verbs:
                    weak_count[word] += 1

        # Only flag if overused (>2 times)
        for verb, count in weak_count.items():
            if count >= 3 and self.weak_verbs[verb]:
                alternatives = ', '.join(self.weak_verbs[verb][:3])
                # Find first sentence containing this verb
                for idx, sent in enumerate(sentences):
                    if re.search(rf'\b{verb}\b', sent, re.IGNORECASE):
                        results.append(self._make_suggestion(
                            original=sent,
                            modified='',
                            rule='style.weak_verb',
                            reason=f'The verb "{verb}" appears {count} times. Consider stronger alternatives: {alternatives}.',
                            severity='low',
                            confidence=0.7,
                            sentence_idx=idx,
                        ))
                        break

        return results

    # ── 6. Adverb Overuse ──
    def _check_adverb_overuse(self, sentences: List[str]) -> List[dict]:
        results = []
        total_words = sum(len(s.split()) for s in sentences)
        adverbs = []

        for idx, sentence in enumerate(sentences):
            found = self.adverb_pattern.findall(sentence.lower())
            # Filter out non-adverbs that end in -ly
            real_adverbs = [a for a in found if a not in {
                'only', 'early', 'family', 'likely', 'lonely', 'lovely',
                'friendly', 'daily', 'weekly', 'monthly', 'yearly',
                'rally', 'ally', 'belly', 'bully', 'jelly', 'folly',
                'holy', 'holy', 'really', 'finally', 'suddenly',
            }]
            adverbs.extend([(a, idx) for a in real_adverbs])

        adverb_rate = len(adverbs) / max(total_words, 1)
        if adverb_rate > 0.04:  # More than 4% of words are adverbs
            adverb_examples = list(set(a for a, _ in adverbs))[:5]
            results.append(self._make_suggestion(
                original='',
                modified='',
                rule='style.adverb_overuse',
                reason=f'High adverb density ({len(adverbs)} adverbs in {total_words} words = {adverb_rate:.1%}). Examples: {", ".join(adverb_examples)}. Show action instead of modifying verbs with -ly adverbs.',
                severity='medium',
                confidence=0.75,
                sentence_idx=0,
            ))

        return results

    # ── 7. Redundancy ──
    def _check_redundancy(self, text: str, sentences: List[str]) -> List[dict]:
        results = []

        for pattern, reason in self.redundancy_phrases:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Find which sentence it's in
                for idx, sent in enumerate(sentences):
                    if re.search(pattern, sent, re.IGNORECASE):
                        fixed = re.sub(pattern, '', sent, count=1, flags=re.IGNORECASE).strip()
                        results.append(self._make_suggestion(
                            original=sent,
                            modified=fixed if fixed != sent else '',
                            rule='redundancy.phrase',
                            reason=reason,
                            severity='medium',
                            confidence=0.85,
                            sentence_idx=idx,
                        ))
                        break

        # Check for repeated ideas (nearby sentences saying the same thing)
        for i in range(len(sentences) - 1):
            sim = self._jaccard_similarity(sentences[i], sentences[i + 1])
            if sim > 0.6 and len(sentences[i].split()) > 5:
                results.append(self._make_suggestion(
                    original=sentences[i + 1],
                    modified='',
                    rule='redundancy.repeated_idea',
                    reason=f'This sentence is very similar to the previous one (similarity: {sim:.0%}). Consider merging or removing one.',
                    severity='medium',
                    confidence=0.8,
                    sentence_idx=i + 1,
                ))

        return results

    # ── 8. Pacing ──
    def _check_pacing(self, sentences: List[str]) -> List[dict]:
        results = []

        # Check for action context with slow descriptions
        window_size = 3
        for i in range(len(sentences)):
            sent = sentences[i]
            sent_lower = sent.lower()

            has_action = any(av in sent_lower for av in self.action_verbs)
            has_urgency = any(w in sent_lower for w in ['quickly', 'urgently', 'fast', 'hurry', 'danger', 'running'])
            has_description = any(re.search(p, sent_lower) for p in self.description_markers)

            # Long descriptive sentences during action
            if has_description and len(sent.split()) > 25:
                # Check local context for action
                nearby = sentences[max(0, i-2):min(len(sentences), i+3)]
                nearby_text = ' '.join(nearby).lower()
                nearby_action = any(av in nearby_text for av in self.action_verbs)

                if nearby_action or has_urgency:
                    results.append(self._make_suggestion(
                        original=sent,
                        modified='',
                        rule='pacing.slow_during_action',
                        reason='Long descriptive passage in an action sequence. This breaks urgency. Move descriptions before/after the action or trim significantly.',
                        severity='medium',
                        confidence=0.8,
                        sentence_idx=i,
                    ))

            # Extremely long sentence in general
            word_count = len(sent.split())
            if word_count > 50:
                results.append(self._make_suggestion(
                    original=sent,
                    modified='',
                    rule='pacing.overlong_sentence',
                    reason=f'This sentence has {word_count} words — extremely long. Break it into 2-3 shorter sentences for better readability and pace.',
                    severity='high',
                    confidence=0.95,
                    sentence_idx=i,
                ))
            elif word_count > 35:
                results.append(self._make_suggestion(
                    original=sent,
                    modified='',
                    rule='pacing.long_sentence',
                    reason=f'This sentence has {word_count} words. Consider splitting for clarity.',
                    severity='medium',
                    confidence=0.8,
                    sentence_idx=i,
                ))

        return results

    # ── 9. Abrupt Transitions ──
    def _check_abrupt_transitions(self, text: str, sentences: List[str]) -> List[dict]:
        results = []

        for pattern in self.abrupt_location_shifts:
            for idx, sent in enumerate(sentences):
                if re.search(pattern, sent, re.IGNORECASE):
                    results.append(self._make_suggestion(
                        original=sent,
                        modified='',
                        rule='structure.abrupt_transition',
                        reason='Abrupt scene or location shift without narrative bridge. Add a transitional sentence or paragraph break to orient the reader.',
                        severity='high',
                        confidence=0.85,
                        sentence_idx=idx,
                    ))

        return results

    # ── 10. Run-on Sentences ──
    def _check_run_on_sentences(self, sentences: List[str]) -> List[dict]:
        results = []

        for idx, sent in enumerate(sentences):
            # Count coordinating conjunctions used as sentence joiners
            conjunctions = len(re.findall(r',\s*(?:and|but|or|so|yet)\s+', sent))
            commas = sent.count(',')
            clauses = len(re.findall(r'\b(?:which|who|that|although|because|where|when|while)\b', sent, re.IGNORECASE))

            if conjunctions >= 3 or (commas >= 4 and clauses >= 2):
                results.append(self._make_suggestion(
                    original=sent,
                    modified='',
                    rule='grammar.run_on_sentence',
                    reason=f'Run-on sentence detected ({conjunctions} conjunctions, {commas} commas). Split into separate sentences at natural break points.',
                    severity='high',
                    confidence=0.85,
                    sentence_idx=idx,
                ))

        return results

    # ── Helpers ──
    def _make_suggestion(self, original: str, modified: str, rule: str,
                         reason: str, severity: str, confidence: float,
                         sentence_idx: int) -> dict:
        return {
            'original_text': original.strip(),
            'modified_text': modified.strip() if modified else '',
            'rule': rule,
            'reason': reason,
            'severity': severity,
            'confidence': confidence,
            'sentence_idx': sentence_idx,
        }

    def _fix_subject_verb(self, sentence: str, match) -> str:
        """Try to fix subject-verb agreement."""
        return sentence  # Complex fix — leave for LLM rewrite

    def _jaccard_similarity(self, text_a: str, text_b: str) -> float:
        stop = {'the', 'a', 'an', 'is', 'was', 'were', 'are', 'in', 'on', 'at', 'to', 'and', 'but', 'or', 'of', 'for', 'with', 'that', 'this', 'it'}
        words_a = set(re.findall(r'\b\w+\b', text_a.lower())) - stop
        words_b = set(re.findall(r'\b\w+\b', text_b.lower())) - stop
        if not words_a or not words_b:
            return 0.0
        return len(words_a & words_b) / len(words_a | words_b)

    def _split_sentences(self, text: str) -> List[str]:
        # Limit text length to prevent regex hanging
        text = text[:50000]
        # Basic split by punctuation, but handles missing spaces better than (?<=[.!?])\s+
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip() and len(s.strip()) > 3]

    def _split_paragraphs(self, text: str) -> List[str]:
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]

    def _count_by_category(self, suggestions: List[dict]) -> dict:
        counts = Counter()
        for s in suggestions:
            category = s['rule'].split('.')[0]
            counts[category] += 1
        return dict(counts)
