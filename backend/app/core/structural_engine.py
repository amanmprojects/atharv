import re
import math
import time
from typing import Any, List, Dict, Tuple, Optional
from collections import Counter
from dataclasses import dataclass
from app.core.config import settings

@dataclass
class StructuralIssue:
    issue_type: str
    location: dict
    severity: str
    score: float
    explanation: str
    suggestion: Optional[str] = None

class ReadabilityAnalyzer:
    def __init__(self):
        self.syllable_exceptions = {
            'the': 1, 'be': 1, 'to': 1, 'of': 1, 'and': 1, 'a': 1, 'in': 1,
            'that': 1, 'have': 1, 'i': 1, 'it': 1, 'for': 1, 'not': 1, 'on': 1,
            'with': 1, 'he': 1, 'as': 1, 'you': 1, 'do': 1, 'at': 1, 'this': 1,
            'but': 1, 'his': 1, 'by': 1, 'from': 1, 'they': 1, 'we': 1, 'say': 1,
            'her': 1, 'she': 1, 'or': 1, 'an': 1, 'will': 1, 'my': 1, 'one': 1,
            'all': 1, 'would': 1, 'there': 1, 'their': 1, 'what': 1, 'so': 1,
            'up': 1, 'out': 1, 'if': 1, 'about': 2, 'who': 1, 'get': 1, 'which': 1,
            'go': 1, 'me': 1, 'when': 1, 'make': 1, 'can': 1, 'like': 1, 'time': 1,
            'no': 1, 'just': 1, 'him': 1, 'know': 1, 'take': 1, 'people': 2,
        }
        self.dale_chall_easy_words = self._load_dale_chall_words()
    
    def _load_dale_chall_words(self) -> set:
        return {
            'a', 'able', 'about', 'above', 'accept', 'account', 'across', 'act',
            'action', 'add', 'address', 'admit', 'adult', 'affect', 'after', 'again',
            'against', 'age', 'ago', 'agree', 'air', 'all', 'allow', 'almost',
            'alone', 'along', 'already', 'also', 'always', 'am', 'among', 'an',
            'and', 'angel', 'angle', 'animal', 'another', 'answer', 'any', 'anyone',
            'anything', 'appear', 'apple', 'are', 'area', 'arm', 'army', 'around',
            'arrive', 'art', 'as', 'ask', 'at', 'attack', 'away', 'baby', 'back',
            'bad', 'ball', 'bank', 'bar', 'base', 'basic', 'bat', 'be', 'bear',
            'beat', 'beautiful', 'become', 'bed', 'been', 'before', 'began', 'begin',
        }
    
    def count_syllables(self, word: str) -> int:
        word = word.lower().strip('.,!?;:"\'')
        if word in self.syllable_exceptions:
            return self.syllable_exceptions[word]
        
        vowels = 'aeiouy'
        count = 0
        prev_is_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_is_vowel:
                count += 1
            prev_is_vowel = is_vowel
        
        if word.endswith('e') and count > 1:
            count -= 1
        
        return max(1, count)
    
    def flesch_kincaid(self, text: str) -> float:
        sentences = self._split_sentences(text)
        words = self._split_words(text)
        
        if not sentences or not words:
            return 0.0
        
        total_words = len(words)
        total_sentences = len(sentences)
        total_syllables = sum(self.count_syllables(w) for w in words)
        
        score = 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
        return max(0, min(100, score))
    
    def flesch_kincaid_grade(self, text: str) -> float:
        sentences = self._split_sentences(text)
        words = self._split_words(text)
        
        if not sentences or not words:
            return 0.0
        
        total_words = len(words)
        total_sentences = len(sentences)
        total_syllables = sum(self.count_syllables(w) for w in words)
        
        grade = 0.39 * (total_words / total_sentences) + 11.8 * (total_syllables / total_words) - 15.59
        return max(0, grade)
    
    def gunning_fog(self, text: str) -> float:
        sentences = self._split_sentences(text)
        words = self._split_words(text)
        
        if not sentences or not words:
            return 0.0
        
        total_words = len(words)
        total_sentences = len(sentences)
        
        complex_words = sum(1 for w in words if self.count_syllables(w) >= 3)
        
        grade = 0.4 * ((total_words / total_sentences) + 100 * (complex_words / total_words))
        return max(0, grade)
    
    def coleman_liau(self, text: str) -> float:
        sentences = self._split_sentences(text)
        words = self._split_words(text)
        letters = [c for c in text if c.isalpha()]
        
        if not sentences or not words:
            return 0.0
        
        total_letters = len(letters)
        total_words = len(words)
        total_sentences = len(sentences)
        
        L = (total_letters / total_words) * 100
        S = (total_sentences / total_words) * 100
        
        grade = 0.0588 * L - 0.296 * S - 15.8
        return max(0, grade)
    
    def smog(self, text: str) -> float:
        sentences = self._split_sentences(text)
        words = self._split_words(text)
        
        if len(sentences) < 3:
            return 0.0
        
        complex_words = sum(1 for w in words if self.count_syllables(w) >= 3)
        
        grade = 1.0430 * math.sqrt(complex_words * (30 / len(sentences))) + 3.1291
        return max(0, grade)
    
    def dale_chall(self, text: str) -> float:
        sentences = self._split_sentences(text)
        words = self._split_words(text)
        
        if not sentences or not words:
            return 0.0
        
        total_words = len(words)
        total_sentences = len(sentences)
        
        difficult_words = sum(1 for w in words if w.lower() not in self.dale_chall_easy_words)
        
        percent_difficult = (difficult_words / total_words) * 100
        grade = 0.1579 * percent_difficult + 0.0496 * (total_words / total_sentences)
        
        if percent_difficult > 5:
            grade += 3.6365
        
        return max(0, grade)
    
    def get_all_scores(self, text: str) -> dict:
        return {
            "flesch_kincaid": round(self.flesch_kincaid(text), 2),
            "flesch_kincaid_grade": round(self.flesch_kincaid_grade(text), 2),
            "gunning_fog": round(self.gunning_fog(text), 2),
            "coleman_liau": round(self.coleman_liau(text), 2),
            "smog": round(self.smog(text), 2),
            "dale_chall": round(self.dale_chall(text), 2)
        }
    
    def _split_sentences(self, text: str) -> List[str]:
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _split_words(self, text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z]+\b', text)
        return words

class WeakIntroDetector:
    def __init__(self):
        self.hook_indicators = [
            r'"', r"'", r'\?', r'!',
            r'\b(suddenly|immediately|finally|at last)\b',
            r'\b(once|when|as|while)\b.*?\b(was|were|is|are)\b',
        ]
        self.weak_starters = [
            r'^\s*(The|A|An|This|That|It|There|Here)\s+(is|was|were|are)\b',
            r'^\s*(I|We|You|They)\s+(think|believe|feel|want)\b',
            r'^\s*In\s+(this|the|my|our)\b',
        ]
    
    def analyze_intro(self, first_paragraph: str) -> dict:
        sentences = re.split(r'[.!?]+', first_paragraph)
        if not sentences:
            return {"score": 0.5, "issues": [], "suggestion": None}
        
        first_sentence = sentences[0] if sentences else ""
        
        hook_score = 0
        issues = []
        
        for pattern in self.hook_indicators:
            if re.search(pattern, first_sentence, re.IGNORECASE):
                hook_score += 0.15
        
        for pattern in self.weak_starters:
            if re.search(pattern, first_sentence, re.IGNORECASE):
                hook_score -= 0.2
                issues.append("Weak opening pattern detected")
        
        if len(first_sentence.split()) < 5:
            hook_score -= 0.2
            issues.append("First sentence is too short")
        
        if not first_sentence.strip().endswith(('?', '!')):
            pass
        else:
            hook_score += 0.1
        
        score = max(0, min(1, 0.5 + hook_score))
        
        suggestion = None
        if score < 0.5:
            suggestion = "Consider starting with action, dialogue, or a compelling question to hook readers."
        
        return {
            "score": round(score, 2),
            "issues": issues,
            "suggestion": suggestion,
            "first_sentence": first_sentence
        }

class TransitionGapDetector:
    def __init__(self, threshold: float = 0.35):
        self.threshold = threshold
        self.transition_words = {
            'however', 'therefore', 'moreover', 'furthermore', 'nevertheless',
            'consequently', 'meanwhile', 'subsequently', 'finally', 'firstly',
            'secondly', 'additionally', 'similarly', 'conversely', 'instead',
            'thus', 'hence', 'accordingly', 'besides', 'also', 'yet', 'still',
        }
        self.similarity_provider = settings.TRANSITION_SIMILARITY_PROVIDER.lower()
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL
        self.embedding_task_type = settings.OPENAI_EMBEDDING_INPUT_TYPE
        self._embedding_cache: Dict[str, List[float]] = {}
        self._embedding_cache_max_size = 2048
        self._embedding_client: Optional[Any] = None
        self._embeddings_enabled = False
        self._initialize_embedding_provider()
    
    def detect_gaps(self, paragraphs: List[str]) -> List[StructuralIssue]:
        issues = []
        
        if len(paragraphs) < 2:
            return issues

        boundaries: List[Tuple[str, str]] = []
        transitions: List[bool] = []
        
        for i in range(len(paragraphs) - 1):
            para_a = paragraphs[i]
            para_b = paragraphs[i + 1]
            
            last_sentence = self._get_last_sentence(para_a)
            first_sentence = self._get_first_sentence(para_b)

            boundaries.append((last_sentence, first_sentence))
            transitions.append(self._has_transition_word(first_sentence))

        similarities = self._calculate_similarities(boundaries)
        
        for i, similarity in enumerate(similarities):
            has_transition = transitions[i]
            
            if similarity < self.threshold and not has_transition:
                severity = "high" if similarity < 0.2 else "medium"
                
                issues.append(StructuralIssue(
                    issue_type="transition_gap",
                    location={"between_paragraphs": [i, i + 1]},
                    severity=severity,
                    score=round(similarity, 2),
                    explanation=f"Semantic similarity between end of paragraph {i + 1} and start of paragraph {i + 2} is only {similarity:.2f} — readers may perceive an abrupt topic shift.",
                    suggestion=f"Consider adding a transitional sentence linking the two paragraphs."
                ))
        
        return issues
    
    def _get_last_sentence(self, text: str) -> str:
        sentences = self._extract_sentences(text)
        return sentences[-1] if sentences else ""
    
    def _get_first_sentence(self, text: str) -> str:
        sentences = self._extract_sentences(text)
        return sentences[0] if sentences else ""

    def _extract_sentences(self, text: str) -> List[str]:
        # Keep only non-empty segments so trailing punctuation does not
        # produce empty "last sentence" values.
        return [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]

    def _calculate_similarities(self, boundaries: List[Tuple[str, str]]) -> List[float]:
        if not boundaries:
            return []

        if self._embeddings_enabled:
            embedding_sims = self._embedding_similarities(boundaries)
            if embedding_sims is not None:
                return embedding_sims

        return [self._simple_similarity(a, b) for a, b in boundaries]
    
    def _simple_similarity(self, text_a: str, text_b: str) -> float:
        words_a = set(re.findall(r'\b\w+\b', text_a.lower()))
        words_b = set(re.findall(r'\b\w+\b', text_b.lower()))
        
        stop_words = {'the', 'a', 'an', 'is', 'was', 'were', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though'}
        
        words_a = words_a - stop_words
        words_b = words_b - stop_words
        
        if not words_a or not words_b:
            return 0.0
        
        intersection = words_a & words_b
        union = words_a | words_b
        
        return len(intersection) / len(union) if union else 0.0
    
    def _has_transition_word(self, text: str) -> bool:
        words = set(re.findall(r'\b\w+\b', text.lower()))
        return bool(words & self.transition_words)

    def _initialize_embedding_provider(self) -> None:
        if self.similarity_provider not in {"openai", "gemini"}:
            return

        api_key = settings.OPENAI_COMPAT_API_KEY or settings.GEMINI_API_KEY
        if not api_key or not settings.OPENAI_COMPAT_BASE_URL:
            return

        try:
            from openai import OpenAI

            self._embedding_client = OpenAI(
                api_key=api_key,
                base_url=settings.OPENAI_COMPAT_BASE_URL,
            )
            self._embeddings_enabled = True
        except Exception:
            self._embeddings_enabled = False
            self._embedding_client = None

    def _embedding_similarities(
        self, boundaries: List[Tuple[str, str]]
    ) -> Optional[List[float]]:
        if self._embedding_client is None:
            return None

        uncached_sentences: List[str] = []
        seen = set()
        for text_a, text_b in boundaries:
            for text in (text_a, text_b):
                if text and text not in self._embedding_cache and text not in seen:
                    uncached_sentences.append(text)
                    seen.add(text)

        if uncached_sentences:
            try:
                response = self._embed_with_retries(
                    uncached_sentences,
                )
                vectors = [item.embedding for item in response.data]

                if len(vectors) != len(uncached_sentences):
                    return None

                for text, vector in zip(uncached_sentences, vectors):
                    self._embedding_cache[text] = vector

                if len(self._embedding_cache) > self._embedding_cache_max_size:
                    self._embedding_cache.clear()
            except Exception:
                # Fail open to lexical similarity when embedding calls are unavailable.
                self._embeddings_enabled = False
                return None

        similarities: List[float] = []
        for text_a, text_b in boundaries:
            vector_a = self._embedding_cache.get(text_a)
            vector_b = self._embedding_cache.get(text_b)

            if vector_a is None or vector_b is None:
                similarities.append(self._simple_similarity(text_a, text_b))
                continue

            similarities.append(self._cosine_similarity(vector_a, vector_b))

        return similarities

    def _embed_with_retries(
        self,
        texts: List[str],
        retries: int = 3,
        backoff_seconds: float = 2.0,
    ) -> Any:
        if self._embedding_client is None:
            raise RuntimeError("Embedding client is not initialized.")

        for attempt in range(retries):
            try:
                return self._embedding_client.embeddings.create(
                    model=self.embedding_model,
                    input=texts,
                    extra_body={"input_type": self.embedding_task_type},
                )
            except Exception:
                if attempt == retries - 1:
                    raise
                wait_time = backoff_seconds * (2 ** attempt)
                time.sleep(wait_time)

    def _cosine_similarity(self, vector_a: List[float], vector_b: List[float]) -> float:
        if not vector_a or not vector_b:
            return 0.0

        length = min(len(vector_a), len(vector_b))
        if length == 0:
            return 0.0

        dot = 0.0
        norm_a = 0.0
        norm_b = 0.0
        for i in range(length):
            a = float(vector_a[i])
            b = float(vector_b[i])
            dot += a * b
            norm_a += a * a
            norm_b += b * b

        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0

        cosine = dot / (math.sqrt(norm_a) * math.sqrt(norm_b))
        return max(0.0, min(1.0, cosine))

class RedundancyDetector:
    def __init__(self, threshold: float = 0.85):
        self.threshold = threshold
    
    def detect_redundancy(self, paragraphs: List[str]) -> List[StructuralIssue]:
        issues = []
        sentences = []
        
        for para_idx, para in enumerate(paragraphs):
            para_sentences = re.split(r'[.!?]+', para)
            for sent in para_sentences:
                sent = sent.strip()
                if sent and len(sent.split()) > 3:
                    sentences.append({"text": sent, "paragraph": para_idx})
        
        for i, sent_a in enumerate(sentences):
            for j, sent_b in enumerate(sentences[i+1:], i+1):
                similarity = self._sentence_similarity(sent_a["text"], sent_b["text"])
                
                if similarity > self.threshold:
                    issues.append(StructuralIssue(
                        issue_type="redundancy",
                        location={
                            "first_occurrence": {"paragraph": sent_a["paragraph"], "text": sent_a["text"][:100]},
                            "duplicate": {"paragraph": sent_b["paragraph"], "text": sent_b["text"][:100]}
                        },
                        severity="medium",
                        score=round(similarity, 2),
                        explanation=f"Semantically similar sentences found in paragraphs {sent_a['paragraph']} and {sent_b['paragraph']}.",
                        suggestion="Consider removing or rephrasing one of the similar sentences."
                    ))
        
        return issues[:10]
    
    def _sentence_similarity(self, text_a: str, text_b: str) -> float:
        words_a = set(re.findall(r'\b\w+\b', text_a.lower()))
        words_b = set(re.findall(r'\b\w+\b', text_b.lower()))
        
        if not words_a or not words_b:
            return 0.0
        
        intersection = words_a & words_b
        union = words_a | words_b
        
        return len(intersection) / len(union) if union else 0.0

class SentenceComplexityScorer:
    def analyze(self, text: str) -> dict:
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return {"avg_complexity": 0, "complex_sentences": [], "recommendations": []}
        
        scores = []
        complex_sentences = []
        
        for idx, sent in enumerate(sentences):
            score = self._calculate_complexity(sent)
            scores.append(score)
            
            if score > 0.7:
                complex_sentences.append({
                    "index": idx,
                    "text": sent[:100],
                    "score": round(score, 2),
                    "word_count": len(sent.split())
                })
        
        avg_complexity = sum(scores) / len(scores) if scores else 0
        
        recommendations = []
        if avg_complexity > 0.6:
            recommendations.append("Consider breaking down complex sentences for better readability.")
        
        return {
            "avg_complexity": round(avg_complexity, 2),
            "complex_sentences": complex_sentences,
            "recommendations": recommendations
        }
    
    def _calculate_complexity(self, sentence: str) -> float:
        words = sentence.split()
        word_count = len(words)
        
        clause_markers = sum(1 for w in words if w.lower() in {
            'that', 'which', 'who', 'whom', 'whose', 'where', 'when', 'while', 'although', 'because', 'since', 'if', 'unless', 'until', 'before', 'after'
        })
        
        punctuation = sum(1 for c in sentence if c in ',;:')
        
        passive_indicators = len(re.findall(r'\b(was|were|been|being|is|are|am)\s+\w+ed\b', sentence.lower()))
        
        complexity = (
            min(word_count / 30, 1) * 0.4 +
            min(clause_markers / 3, 1) * 0.3 +
            min(punctuation / 4, 1) * 0.15 +
            min(passive_indicators / 2, 1) * 0.15
        )
        
        return min(complexity, 1)

class StructuralIntelligenceEngine:
    def __init__(self):
        self.readability = ReadabilityAnalyzer()
        self.intro_detector = WeakIntroDetector()
        self.transition_detector = TransitionGapDetector()
        self.redundancy_detector = RedundancyDetector()
        self.complexity_scorer = SentenceComplexityScorer()
    
    def analyze(self, text: str) -> dict:
        paragraphs = self._split_paragraphs(text)
        
        readability_scores = self.readability.get_all_scores(text)
        
        intro_analysis = {}
        if paragraphs:
            intro_analysis = self.intro_detector.analyze_intro(paragraphs[0])
        
        transition_gaps = self.transition_detector.detect_gaps(paragraphs)
        
        redundancy_issues = self.redundancy_detector.detect_redundancy(paragraphs)
        
        complexity_analysis = self.complexity_scorer.analyze(text)
        
        all_issues = []
        
        if intro_analysis.get("score", 1) < 0.5:
            all_issues.append({
                "issue_type": "weak_intro",
                "location": {"paragraph": 0},
                "severity": "medium",
                "score": intro_analysis.get("score", 0),
                "explanation": "Opening paragraph lacks a strong hook to engage readers.",
                "suggestion": intro_analysis.get("suggestion")
            })
        
        for gap in transition_gaps:
            all_issues.append({
                "issue_type": gap.issue_type,
                "location": gap.location,
                "severity": gap.severity,
                "score": gap.score,
                "explanation": gap.explanation,
                "suggestion": gap.suggestion
            })
        
        for redundancy in redundancy_issues:
            all_issues.append({
                "issue_type": redundancy.issue_type,
                "location": redundancy.location,
                "severity": redundancy.severity,
                "score": redundancy.score,
                "explanation": redundancy.explanation,
                "suggestion": redundancy.suggestion
            })
        
        for cs in complexity_analysis.get("complex_sentences", []):
            all_issues.append({
                "issue_type": "complex_sentence",
                "location": {"sentence_index": cs["index"]},
                "severity": "low",
                "score": cs["score"],
                "explanation": f"Sentence with {cs['word_count']} words may be difficult to follow.",
                "suggestion": "Consider breaking into shorter sentences."
            })
        
        return {
            "readability_scores": readability_scores,
            "intro_analysis": intro_analysis,
            "complexity_analysis": complexity_analysis,
            "issues": all_issues,
            "statistics": {
                "paragraph_count": len(paragraphs),
                "issue_count": len(all_issues),
                "avg_readability": readability_scores.get("flesch_kincaid", 0)
            }
        }
    
    def _split_paragraphs(self, text: str) -> List[str]:
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
