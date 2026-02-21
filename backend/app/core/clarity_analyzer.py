import re
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass


@dataclass
class SentenceMetrics:
    text: str
    word_count: int
    syllable_count: int
    has_passive_voice: bool
    has_long_sentence: bool
    has_complex_words: bool
    issues: List[str]


class ClarityAnalyzer:
    def __init__(self):
        self.common_words = self._load_common_words()
        self.transition_words = {
            'addition': ['additionally', 'also', 'furthermore', 'moreover', 'besides', 'too', 'and'],
            'contrast': ['however', 'but', 'nevertheless', 'yet', 'although', 'though', 'despite'],
            'cause_effect': ['therefore', 'thus', 'consequently', 'hence', 'because', 'since', 'so'],
            'sequence': ['first', 'second', 'next', 'then', 'finally', 'meanwhile', 'subsequently'],
            'example': ['for example', 'for instance', 'such as', 'specifically', 'to illustrate'],
            'conclusion': ['in conclusion', 'in summary', 'to sum up', 'overall', 'finally'],
        }
        
        self.vague_words = ['thing', 'stuff', 'something', 'anything', 'everything', 'nice', 'good', 'bad', 'really', 'very']
        
        self.cliche_patterns = [
            r'\bat the end of the day\b',
            r'\bbottom line\b',
            r'\bthink outside the box\b',
            r'\bhit the ground running\b',
            r'\bno-brainer\b',
            r'\bgame changer\b',
            r'\bgoing forward\b',
            r'\bleverage\b',
            r'\bsynergy\b',
            r'\bparadigm shift\b',
            r'\bballpark\b',
            r'\bback to the drawing board\b',
        ]
    
    def _load_common_words(self) -> set:
        return {
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
            'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
            'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
            'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
            'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
            'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
        }
    
    def analyze(self, text: str) -> Dict[str, Any]:
        sentences = self._split_sentences(text)
        
        sentence_metrics = [self._analyze_sentence(s) for s in sentences]
        
        readability = self._calculate_readability(text, sentence_metrics)
        
        flow_analysis = self._analyze_flow(sentences)
        
        clarity_issues = self._detect_clarity_issues(text, sentences)
        
        suggestions = self._generate_suggestions(clarity_issues, sentence_metrics)
        
        return {
            "readability_scores": readability,
            "flow_analysis": flow_analysis,
            "clarity_issues": clarity_issues,
            "suggestions": suggestions,
            "statistics": {
                "sentence_count": len(sentences),
                "word_count": sum(m.word_count for m in sentence_metrics),
                "average_sentence_length": sum(m.word_count for m in sentence_metrics) / len(sentences) if sentences else 0,
                "passive_voice_count": sum(1 for m in sentence_metrics if m.has_passive_voice),
                "long_sentence_count": sum(1 for m in sentence_metrics if m.has_long_sentence),
            }
        }
    
    def _split_sentences(self, text: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _analyze_sentence(self, sentence: str) -> SentenceMetrics:
        words = re.findall(r'\b\w+\b', sentence.lower())
        word_count = len(words)
        
        syllable_count = sum(self._count_syllables(w) for w in words)
        
        has_passive = self._detect_passive_voice(sentence)
        
        has_long = word_count > 25
        
        complex_words = [w for w in words if self._count_syllables(w) >= 3 and w not in self.common_words]
        has_complex = len(complex_words) > word_count * 0.3
        
        issues = []
        if has_passive:
            issues.append("passive_voice")
        if has_long:
            issues.append("long_sentence")
        if has_complex:
            issues.append("complex_words")
        
        return SentenceMetrics(
            text=sentence,
            word_count=word_count,
            syllable_count=syllable_count,
            has_passive_voice=has_passive,
            has_long_sentence=has_long,
            has_complex_words=has_complex,
            issues=issues
        )
    
    def _count_syllables(self, word: str) -> int:
        word = word.lower()
        if len(word) <= 3:
            return 1
        
        vowels = 'aeiouy'
        count = 0
        prev_is_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_is_vowel:
                count += 1
            prev_is_vowel = is_vowel
        
        if word.endswith('e'):
            count -= 1
        if word.endswith('le') and len(word) > 2 and word[-3] not in vowels:
            count += 1
        if count == 0:
            count = 1
        
        return count
    
    def _detect_passive_voice(self, sentence: str) -> bool:
        passive_pattern = r'\b(am|is|are|was|were|be|been|being)\s+\w+ed\b'
        return bool(re.search(passive_pattern, sentence, re.IGNORECASE))
    
    def _calculate_readability(self, text: str, metrics: List[SentenceMetrics]) -> Dict[str, Any]:
        if not metrics:
            return {"flesch_kincaid": 0, "gunning_fog": 0, "smog": 0}
        
        total_words = sum(m.word_count for m in metrics)
        total_sentences = len(metrics)
        total_syllables = sum(m.syllable_count for m in metrics)
        
        complex_words = sum(
            1 for m in metrics for word in re.findall(r'\b\w+\b', m.text.lower())
            if self._count_syllables(word) >= 3
        )
        
        if total_words == 0 or total_sentences == 0:
            return {"flesch_kincaid": 0, "gunning_fog": 0, "smog": 0}
        
        flesch = 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
        flesch = max(0, min(100, flesch))
        
        fog = 0.4 * ((total_words / total_sentences) + 100 * (complex_words / total_words))
        
        smog = 1.0430 * (complex_words ** 0.5) + 3.1291 if complex_words > 0 else 0
        
        return {
            "flesch_kincaid": round(flesch, 1),
            "gunning_fog": round(fog, 1),
            "smog": round(smog, 1),
            "grade_level": self._grade_level(flesch)
        }
    
    def _grade_level(self, flesch: float) -> str:
        if flesch >= 90:
            return "5th grade"
        elif flesch >= 80:
            return "6th grade"
        elif flesch >= 70:
            return "7th grade"
        elif flesch >= 60:
            return "8th-9th grade"
        elif flesch >= 50:
            return "10th-12th grade"
        elif flesch >= 30:
            return "College"
        else:
            return "Graduate"
    
    def _analyze_flow(self, sentences: List[str]) -> Dict[str, Any]:
        transitions_used = {category: [] for category in self.transition_words}
        
        for i, sentence in enumerate(sentences):
            sentence_lower = sentence.lower()
            for category, words in self.transition_words.items():
                for word in words:
                    if word in sentence_lower:
                        transitions_used[category].append({
                            "sentence_index": i,
                            "word": word
                        })
        
        total_transitions = sum(len(v) for v in transitions_used.values())
        transition_ratio = total_transitions / len(sentences) if sentences else 0
        
        flow_quality = "good" if transition_ratio >= 0.3 else "needs_improvement" if transition_ratio >= 0.15 else "poor"
        
        return {
            "transitions_used": {k: v for k, v in transitions_used.items() if v},
            "transition_count": total_transitions,
            "transition_ratio": round(transition_ratio, 2),
            "flow_quality": flow_quality
        }
    
    def _detect_clarity_issues(self, text: str, sentences: List[str]) -> List[Dict[str, Any]]:
        issues = []
        
        for i, sentence in enumerate(sentences):
            sentence_lower = sentence.lower()
            
            for vague_word in self.vague_words:
                pattern = rf'\b{vague_word}\b'
                if re.search(pattern, sentence_lower):
                    issues.append({
                        "type": "vague_word",
                        "word": vague_word,
                        "sentence_index": i,
                        "sentence": sentence,
                        "suggestion": f"Consider replacing '{vague_word}' with a more specific word"
                    })
            
            for cliche_pattern in self.cliche_patterns:
                cliche_match = re.search(cliche_pattern, sentence_lower)
                if cliche_match:
                    issues.append({
                        "type": "cliche",
                        "phrase": cliche_match.group(0),
                        "sentence_index": i,
                        "sentence": sentence,
                        "suggestion": "Consider rephrasing this cliché"
                    })
            
            words = re.findall(r'\b\w+\b', sentence)
            if len(words) > 35:
                issues.append({
                    "type": "long_sentence",
                    "sentence_index": i,
                    "sentence": sentence,
                    "word_count": len(words),
                    "suggestion": f"This sentence has {len(words)} words. Consider breaking it into shorter sentences."
                })
            
            if len(words) < 5 and i > 0 and i < len(sentences) - 1:
                issues.append({
                    "type": "short_sentence",
                    "sentence_index": i,
                    "sentence": sentence,
                    "suggestion": "Very short sentence. Consider combining with adjacent sentences or adding detail."
                })
        
        repeated_words = {}
        words = re.findall(r'\b\w+\b', text.lower())
        for word in words:
            if len(word) > 4 and word not in self.common_words:
                repeated_words[word] = repeated_words.get(word, 0) + 1
        
        for word, count in repeated_words.items():
            if count > 3:
                issues.append({
                    "type": "repetition",
                    "word": word,
                    "count": count,
                    "suggestion": f"The word '{word}' appears {count} times. Consider using synonyms for variety."
                })
        
        return issues
    
    def _generate_suggestions(
        self, issues: List[Dict[str, Any]], metrics: List[SentenceMetrics]
    ) -> List[Dict[str, Any]]:
        suggestions = []
        
        passive_sentences = [m for m in metrics if m.has_passive_voice]
        if passive_sentences:
            suggestions.append({
                "id": f"sugg_passive_{len(suggestions)}",
                "type": "passive_voice",
                "priority": "high",
                "title": "Reduce Passive Voice",
                "description": f"Found {len(passive_sentences)} sentences with passive voice. Active voice is generally more engaging.",
                "affected_sentences": [m.text for m in passive_sentences[:3]],
                "tip": "Rewrite 'was written by' as 'wrote' or 'were seen by' as 'saw'"
            })
        
        long_sentences = [m for m in metrics if m.has_long_sentence]
        if long_sentences:
            suggestions.append({
                "id": f"sugg_long_{len(suggestions)}",
                "type": "sentence_length",
                "priority": "medium",
                "title": "Shorten Long Sentences",
                "description": f"Found {len(long_sentences)} sentences over 25 words. Long sentences can reduce clarity.",
                "affected_sentences": [m.text[:100] + "..." for m in long_sentences[:3]],
                "tip": "Break long sentences into 2-3 shorter ones"
            })
        
        vague_issues = [i for i in issues if i["type"] == "vague_word"]
        if vague_issues:
            word_counts = {}
            for issue in vague_issues:
                word = issue["word"]
                word_counts[word] = word_counts.get(word, 0) + 1
            
            suggestions.append({
                "id": f"sugg_vague_{len(suggestions)}",
                "type": "vague_words",
                "priority": "medium",
                "title": "Replace Vague Words",
                "description": f"Found {len(vague_issues)} instances of vague words.",
                "affected_words": word_counts,
                "tip": "Replace 'very good' with 'excellent', 'thing' with the specific item, etc."
            })
        
        cliche_issues = [i for i in issues if i["type"] == "cliche"]
        if cliche_issues:
            suggestions.append({
                "id": f"sugg_cliche_{len(suggestions)}",
                "type": "cliches",
                "priority": "low",
                "title": "Avoid Clichés",
                "description": f"Found {len(cliche_issues)} clichéd phrases.",
                "affected_phrases": [i["phrase"] for i in cliche_issues],
                "tip": "Express ideas in your own words for originality"
            })
        
        return suggestions
