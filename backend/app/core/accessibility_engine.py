"""
MODULE 10: Accessibility & Inclusive AI
Sentence simplification, idea clustering, naturalness scoring, and more.
"""
import re
from typing import List, Dict, Optional, Tuple
from collections import defaultdict, Counter
from dataclasses import dataclass, field


@dataclass
class SimplifiedSentence:
    original: str
    simplified: str
    complexity_before: float
    complexity_after: float
    changes_made: List[str]


@dataclass
class IdeaCluster:
    topic: str
    sentences: List[str]
    paragraph_indices: List[int]
    coherence_score: float


class AccessibilityEngine:
    def __init__(self):
        self.complex_words = {
            'utilize': 'use', 'implement': 'do', 'facilitate': 'help',
            'subsequently': 'then', 'approximately': 'about', 'demonstrate': 'show',
            'consequently': 'so', 'nevertheless': 'but', 'furthermore': 'also',
            'notwithstanding': 'despite', 'aforementioned': 'mentioned',
            'commencement': 'start', 'termination': 'end', 'endeavor': 'try',
            'ascertain': 'find out', 'comprehend': 'understand', 'insufficient': 'not enough',
            'predominantly': 'mostly', 'necessitate': 'need', 'constitute': 'make up',
            'subsequent': 'next', 'preliminary': 'early', 'acquisition': 'getting',
            'modification': 'change', 'procurement': 'buying', 'additional': 'more',
            'sufficient': 'enough', 'indicate': 'show', 'eliminate': 'remove',
            'endeavour': 'try', 'commence': 'begin', 'terminate': 'end',
            'accomplish': 'do', 'regarding': 'about', 'concerning': 'about',
            'accomplish': 'achieve', 'aggregate': 'total', 'ameliorate': 'improve',
        }
        
        self.passive_patterns = [
            (r'\b(was|were|is|are|been|being)\s+(\w+ed)\b', 'passive voice'),
            (r'\b(has|have|had)\s+been\s+(\w+ed)\b', 'past passive'),
        ]
        
        self.filler_phrases = [
            'it is important to note that',
            'it should be noted that',
            'it is worth mentioning that',
            'as a matter of fact',
            'in order to',
            'for the purpose of',
            'in the event that',
            'with regard to',
            'with respect to',
            'in light of the fact that',
            'due to the fact that',
            'on account of the fact that',
            'at this point in time',
            'in the near future',
            'at the present time',
            'the fact that',
        ]
        
        self.filler_replacements = {
            'it is important to note that': '',
            'it should be noted that': '',
            'it is worth mentioning that': '',
            'as a matter of fact': 'in fact',
            'in order to': 'to',
            'for the purpose of': 'for',
            'in the event that': 'if',
            'with regard to': 'about',
            'with respect to': 'about',
            'in light of the fact that': 'because',
            'due to the fact that': 'because',
            'on account of the fact that': 'because',
            'at this point in time': 'now',
            'in the near future': 'soon',
            'at the present time': 'now',
            'the fact that': 'that',
        }

        # Common L2 English patterns
        self.l2_patterns = [
            (r'\b(very|really|quite)\s+(very|really|quite)\b', 'Doubled intensifier: "{match}"'),
            (r'\b(the)\s+(informations|advices|furnitures|equipments)\b', 'Uncountable noun with article: "{match}"'),
            (r'\b(he|she)\s+(have)\b', 'Subject-verb disagreement: "{match}"'),
            (r'\b(discuss about)\b', 'Unnecessary preposition: "discuss about" → "discuss"'),
            (r'\b(according to me)\b', 'Non-native phrasing: "according to me" → "in my opinion"'),
            (r'\b(am|is|are)\s+agree\b', 'Non-native phrasing: should be "agree" without "to be"'),
            (r'\b(since\s+\d+\s+years)\b', 'Non-native phrasing: "since X years" → "for X years"'),
            (r'\b(each and every)\b', 'Redundant phrasing: "each and every" → "every"'),
        ]

    def analyze(self, text: str) -> Dict:
        paragraphs = self._split_paragraphs(text)
        sentences = self._split_sentences(text)
        
        # Sentence simplification analysis
        simplification = self._analyze_simplification(sentences)
        
        # Idea clustering for ADHD support
        idea_clusters = self._cluster_ideas(paragraphs)
        
        # Naturalness scoring (L2 English)
        naturalness = self._score_naturalness(text, sentences)
        
        # Readability assessment
        readability = self._assess_readability(text, sentences)
        
        # Dyslexia-friendly suggestions
        dyslexia_tips = self._dyslexia_suggestions(text, sentences)
        
        # Voice-to-text structure suggestions
        structure_suggestions = self._suggest_structure(text, paragraphs)
        
        return {
            "simplification": simplification,
            "idea_clusters": idea_clusters,
            "naturalness": naturalness,
            "readability_assessment": readability,
            "dyslexia_suggestions": dyslexia_tips,
            "structure_suggestions": structure_suggestions,
            "overall_accessibility_score": self._overall_score(
                simplification, naturalness, readability
            ),
        }

    def _split_paragraphs(self, text: str) -> List[str]:
        return [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]

    def _split_sentences(self, text: str) -> List[str]:
        return [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    def _analyze_simplification(self, sentences: List[str]) -> Dict:
        """Identify complex sentences and suggest simplifications."""
        complex_sentences = []
        simplified = []
        
        for i, sentence in enumerate(sentences):
            complexity = self._sentence_complexity(sentence)
            if complexity > 0.6:
                simple_version = self._simplify_sentence(sentence)
                new_complexity = self._sentence_complexity(simple_version)
                
                changes = []
                # Identify what was changed
                for complex_word, simple_word in self.complex_words.items():
                    if complex_word in sentence.lower():
                        changes.append(f"'{complex_word}' → '{simple_word}'")
                
                for filler in self.filler_phrases:
                    if filler in sentence.lower():
                        changes.append(f"Removed filler: '{filler}'")
                
                if len(sentence.split()) > 30:
                    changes.append("Long sentence — consider splitting")
                
                complex_sentences.append({
                    "index": i,
                    "original": sentence,
                    "simplified": simple_version,
                    "complexity_before": round(complexity, 2),
                    "complexity_after": round(new_complexity, 2),
                    "changes": changes,
                })
        
        return {
            "total_sentences": len(sentences),
            "complex_count": len(complex_sentences),
            "simplification_potential": round(len(complex_sentences) / max(len(sentences), 1) * 100, 1),
            "complex_sentences": complex_sentences[:15],
        }

    def _sentence_complexity(self, sentence: str) -> float:
        """Score sentence complexity from 0 (simple) to 1 (very complex)."""
        words = sentence.split()
        word_count = len(words)
        
        if word_count == 0:
            return 0
        
        # Factors
        length_score = min(word_count / 40, 1.0)  # Long sentences = complex
        
        # Complex word percentage
        complex_word_count = sum(1 for w in words if len(w) > 8)
        complex_pct = complex_word_count / word_count
        
        # Clause count (commas, semicolons, conjunctions)
        clause_markers = len(re.findall(r'[,;]|\b(?:and|but|or|because|although|while|whereas|however)\b', sentence))
        clause_score = min(clause_markers / 5, 1.0)
        
        # Passive voice
        has_passive = bool(re.search(r'\b(?:was|were|been|being|is|are)\s+\w+ed\b', sentence.lower()))
        passive_score = 0.3 if has_passive else 0
        
        # Filler phrases
        has_filler = any(f in sentence.lower() for f in self.filler_phrases)
        filler_score = 0.2 if has_filler else 0
        
        return min(1.0, length_score * 0.3 + complex_pct * 0.25 + clause_score * 0.2 + passive_score + filler_score)

    def _simplify_sentence(self, sentence: str) -> str:
        """Apply rule-based simplification."""
        result = sentence
        
        # Replace complex words
        for complex_word, simple_word in self.complex_words.items():
            pattern = re.compile(re.escape(complex_word), re.IGNORECASE)
            result = pattern.sub(simple_word, result)
        
        # Remove filler phrases
        for filler, replacement in self.filler_replacements.items():
            pattern = re.compile(re.escape(filler), re.IGNORECASE)
            result = pattern.sub(replacement, result)
        
        # Clean up extra spaces
        result = re.sub(r'\s+', ' ', result).strip()
        
        return result

    def _cluster_ideas(self, paragraphs: List[str]) -> Dict:
        """Group scattered ideas by topic for ADHD support."""
        # Extract keywords per paragraph
        para_keywords = []
        for para in paragraphs:
            words = re.findall(r'\b[a-z]{3,}\b', para.lower())
            stop = {'the', 'and', 'that', 'this', 'with', 'from', 'have', 'been',
                    'they', 'their', 'which', 'about', 'would', 'could', 'should',
                    'more', 'also', 'than', 'other', 'into', 'some', 'only', 'very'}
            meaningful = [w for w in words if w not in stop]
            counter = Counter(meaningful)
            para_keywords.append(set(w for w, c in counter.most_common(10)))
        
        # Group paragraphs by keyword overlap
        clusters = []
        used = set()
        
        for i in range(len(paragraphs)):
            if i in used:
                continue
            cluster_paras = [i]
            cluster_keywords = para_keywords[i].copy()
            
            for j in range(i + 1, len(paragraphs)):
                if j in used:
                    continue
                overlap = len(cluster_keywords & para_keywords[j])
                if overlap >= 2:
                    cluster_paras.append(j)
                    cluster_keywords |= para_keywords[j]
                    used.add(j)
            
            if len(cluster_paras) > 1:
                # Find topic label (most common keyword)
                all_words = []
                for idx in cluster_paras:
                    all_words.extend(list(para_keywords[idx]))
                topic = Counter(all_words).most_common(1)[0][0] if all_words else "general"
                
                clusters.append({
                    "topic": topic,
                    "paragraph_indices": cluster_paras,
                    "paragraph_count": len(cluster_paras),
                    "is_scattered": not all(cluster_paras[j] == cluster_paras[j-1] + 1 
                                           for j in range(1, len(cluster_paras))),
                    "suggestion": f"Paragraphs about '{topic}' are scattered. Consider grouping them together." 
                                  if not all(cluster_paras[j] == cluster_paras[j-1] + 1 
                                           for j in range(1, len(cluster_paras))) else None,
                })
            used.add(i)
        
        scattered_count = sum(1 for c in clusters if c.get("is_scattered"))
        
        return {
            "clusters": clusters,
            "total_clusters": len(clusters),
            "scattered_topics": scattered_count,
            "reorganization_needed": scattered_count > 0,
            "suggestion": "Some related ideas are scattered across non-adjacent paragraphs. Consider reorganizing for better focus." if scattered_count > 0 else "Ideas are well-organized.",
        }

    def _score_naturalness(self, text: str, sentences: List[str]) -> Dict:
        """Score natural English phrasing (L2 English detection)."""
        issues = []
        
        for i, sentence in enumerate(sentences):
            for pattern, desc_template in self.l2_patterns:
                matches = re.finditer(pattern, sentence, re.IGNORECASE)
                for match in matches:
                    issues.append({
                        "sentence_index": i,
                        "sentence": sentence[:150],
                        "issue": desc_template.format(match=match.group(0)),
                        "match": match.group(0),
                        "position": match.start(),
                    })
        
        total_sentences = max(len(sentences), 1)
        issue_rate = len(issues) / total_sentences
        naturalness_score = max(0, 100 - issue_rate * 100)
        
        return {
            "score": round(naturalness_score, 1),
            "issues": issues[:15],
            "issue_count": len(issues),
            "is_natural": naturalness_score > 80,
            "grade": "Native" if naturalness_score > 90 else
                     "Near-native" if naturalness_score > 70 else
                     "Intermediate" if naturalness_score > 50 else "Basic",
        }

    def _assess_readability(self, text: str, sentences: List[str]) -> Dict:
        """Comprehensive readability assessment."""
        words = text.split()
        word_count = len(words)
        sentence_count = max(len(sentences), 1)
        
        avg_sentence_length = word_count / sentence_count
        long_sentences = sum(1 for s in sentences if len(s.split()) > 25)
        short_sentences = sum(1 for s in sentences if len(s.split()) < 5)
        
        # Average word length
        avg_word_length = sum(len(w) for w in words) / max(word_count, 1)
        
        # Grade level estimation
        grade = 0.39 * avg_sentence_length + 11.8 * (sum(self._count_syllables(w) for w in words) / max(word_count, 1)) - 15.59
        grade = max(1, min(16, grade))
        
        return {
            "grade_level": round(grade, 1),
            "avg_sentence_length": round(avg_sentence_length, 1),
            "avg_word_length": round(avg_word_length, 1),
            "long_sentences_count": long_sentences,
            "short_sentences_count": short_sentences,
            "sentence_length_variety": "good" if long_sentences < sentence_count * 0.3 else "poor",
            "recommended_audience": "Elementary" if grade < 6 else
                                    "Middle School" if grade < 9 else
                                    "High School" if grade < 12 else
                                    "College" if grade < 14 else "Graduate",
        }

    def _count_syllables(self, word: str) -> int:
        word = word.lower().strip()
        if len(word) <= 2:
            return 1
        vowels = 'aeiouy'
        count = 0
        prev_vowel = False
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel
        if word.endswith('e') and count > 1:
            count -= 1
        return max(1, count)

    def _dyslexia_suggestions(self, text: str, sentences: List[str]) -> Dict:
        """Dyslexia-friendly formatting and content suggestions."""
        suggestions = []
        
        avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        if avg_sentence_length > 20:
            suggestions.append({
                "type": "sentence_length",
                "suggestion": "Shorten sentences to 15-20 words for easier reading.",
                "priority": "high",
            })
        
        # Check for complex formatting
        if text.count('(') > 3:
            suggestions.append({
                "type": "parentheses",
                "suggestion": "Reduce use of parenthetical asides — they break reading flow.",
                "priority": "medium",
            })
        
        # Check paragraph length
        paras = self._split_paragraphs(text)
        long_paras = sum(1 for p in paras if len(p.split()) > 100)
        if long_paras > 0:
            suggestions.append({
                "type": "paragraph_length",
                "suggestion": f"{long_paras} paragraph(s) exceed 100 words. Break them into shorter paragraphs.",
                "priority": "high",
            })
        
        # Font recommendations
        suggestions.append({
            "type": "font",
            "suggestion": "Use OpenDyslexic or similar dyslexia-friendly font with increased line spacing (1.5+).",
            "priority": "medium",
        })
        
        # Check for justified text patterns
        suggestions.append({
            "type": "alignment",
            "suggestion": "Use left-aligned text (not justified) to maintain consistent word spacing.",
            "priority": "low",
        })
        
        return {
            "suggestions": suggestions,
            "dyslexia_friendly_score": max(0, 100 - long_paras * 15 - max(0, avg_sentence_length - 15) * 3),
        }

    def _suggest_structure(self, text: str, paragraphs: List[str]) -> Dict:
        """Suggest structural improvements for voice-to-text content."""
        suggestions = []
        
        # Check for missing headings
        has_headings = bool(re.search(r'^#+\s+', text, re.MULTILINE))
        if not has_headings and len(paragraphs) > 3:
            suggestions.append({
                "type": "add_headings",
                "suggestion": "Add headings to break content into sections. This helps with scannability.",
                "auto_suggestions": self._auto_suggest_headings(paragraphs),
            })
        
        # Check for bullet-point-worthy content
        for i, para in enumerate(paragraphs):
            items = re.findall(r'(?:first|second|third|fourth|also|additionally|moreover|furthermore|finally)\b', 
                             para, re.IGNORECASE)
            if len(items) >= 2:
                suggestions.append({
                    "type": "convert_to_list",
                    "paragraph": i,
                    "suggestion": f"Paragraph {i+1} contains enumerated items. Consider converting to a bullet list.",
                })
        
        return {
            "suggestions": suggestions,
            "structure_score": 80 if has_headings else 40,
        }

    def _auto_suggest_headings(self, paragraphs: List[str]) -> List[Dict]:
        """Auto-generate heading suggestions for paragraphs."""
        suggestions = []
        for i, para in enumerate(paragraphs):
            words = re.findall(r'\b[a-z]{3,}\b', para.lower())
            stop = {'the', 'and', 'that', 'this', 'with', 'from', 'have', 'been', 'they',
                    'their', 'which', 'about', 'would', 'could', 'should', 'more', 'also'}
            meaningful = [w for w in words if w not in stop]
            if meaningful:
                top_words = Counter(meaningful).most_common(3)
                heading = ' '.join(w.capitalize() for w, _ in top_words)
                suggestions.append({"paragraph": i, "suggested_heading": heading})
        return suggestions[:5]

    def _overall_score(self, simplification: Dict, naturalness: Dict, readability: Dict) -> Dict:
        simp_score = max(0, 100 - simplification.get("simplification_potential", 0))
        nat_score = naturalness.get("score", 50)
        grade = readability.get("grade_level", 10)
        read_score = max(0, 100 - abs(grade - 8) * 10)  # Ideal around grade 8
        
        overall = (simp_score * 0.3 + nat_score * 0.3 + read_score * 0.4)
        
        return {
            "overall": round(overall, 1),
            "simplification": round(simp_score, 1),
            "naturalness": round(nat_score, 1),
            "readability": round(read_score, 1),
            "grade": "Excellent" if overall > 80 else
                     "Good" if overall > 60 else
                     "Fair" if overall > 40 else "Needs Improvement",
        }
