import re
from typing import List, Dict, Tuple, Optional
from collections import Counter
from dataclasses import dataclass

@dataclass
class StyleMetrics:
    sentence_length_mean: float
    sentence_length_std: float
    passive_voice_ratio: float
    vocabulary_complexity: float
    dialogue_percentage: float
    narrative_density: float
    adverb_usage_rate: float
    rhetorical_question_frequency: float
    paragraph_length_variance: float

class StyleFingerprintEngine:
    def __init__(self):
        self.adverbs = self._load_adverb_suffixes()
        self.passive_indicators = ['was', 'were', 'been', 'being', 'is', 'are', 'am', 'be']
        self.common_words = self._load_common_words()
        self.archetypes = self._define_archetypes()
    
    def _load_adverb_suffixes(self) -> set:
        return {'ly'}
    
    def _load_common_words(self) -> set:
        return {
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
            'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
            'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
            'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
            'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
            'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
            'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
        }
    
    def _define_archetypes(self) -> Dict[str, Dict[str, float]]:
        return {
            'hemingway': {
                'sentence_length_mean': 12,
                'passive_voice_ratio': 0.05,
                'vocabulary_complexity': 0.3,
                'dialogue_percentage': 0.4,
                'adverb_usage_rate': 0.02,
            },
            'tolkien': {
                'sentence_length_mean': 22,
                'passive_voice_ratio': 0.15,
                'vocabulary_complexity': 0.7,
                'dialogue_percentage': 0.25,
                'adverb_usage_rate': 0.08,
            },
            'academic': {
                'sentence_length_mean': 25,
                'passive_voice_ratio': 0.3,
                'vocabulary_complexity': 0.8,
                'dialogue_percentage': 0.0,
                'adverb_usage_rate': 0.05,
            },
            'journalistic': {
                'sentence_length_mean': 15,
                'passive_voice_ratio': 0.1,
                'vocabulary_complexity': 0.4,
                'dialogue_percentage': 0.1,
                'adverb_usage_rate': 0.03,
            },
        }
    
    def analyze(self, text: str) -> StyleMetrics:
        sentences = self._split_sentences(text)
        words = self._split_words(text)
        paragraphs = self._split_paragraphs(text)
        
        if not sentences or not words:
            return StyleMetrics(
                sentence_length_mean=0, sentence_length_std=0,
                passive_voice_ratio=0, vocabulary_complexity=0,
                dialogue_percentage=0, narrative_density=0,
                adverb_usage_rate=0, rhetorical_question_frequency=0,
                paragraph_length_variance=0
            )
        
        sentence_lengths = [len(self._split_words(s)) for s in sentences]
        sentence_length_mean = sum(sentence_lengths) / len(sentence_lengths) if sentence_lengths else 0
        sentence_length_std = self._std_dev(sentence_lengths) if len(sentence_lengths) > 1 else 0
        
        passive_count = self._count_passive_voice(text, sentences)
        passive_voice_ratio = passive_count / len(sentences) if sentences else 0
        
        vocabulary_complexity = self._calculate_vocabulary_complexity(words)
        
        dialogue_percentage = self._calculate_dialogue_percentage(text)
        
        narrative_density = self._calculate_narrative_density(text)
        
        adverb_count = self._count_adverbs(words)
        adverb_usage_rate = adverb_count / len(words) if words else 0
        
        question_count = text.count('?')
        rhetorical_count = self._count_rhetorical_questions(sentences)
        rhetorical_question_frequency = rhetorical_count / len(sentences) if sentences else 0
        
        paragraph_lengths = [len(self._split_words(p)) for p in paragraphs]
        paragraph_length_variance = self._variance(paragraph_lengths) if paragraph_lengths else 0
        
        return StyleMetrics(
            sentence_length_mean=round(sentence_length_mean, 2),
            sentence_length_std=round(sentence_length_std, 2),
            passive_voice_ratio=round(passive_voice_ratio, 3),
            vocabulary_complexity=round(vocabulary_complexity, 3),
            dialogue_percentage=round(dialogue_percentage, 3),
            narrative_density=round(narrative_density, 3),
            adverb_usage_rate=round(adverb_usage_rate, 4),
            rhetorical_question_frequency=round(rhetorical_question_frequency, 4),
            paragraph_length_variance=round(paragraph_length_variance, 2)
        )
    
    def _split_sentences(self, text: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _split_words(self, text: str) -> List[str]:
        return re.findall(r'\b[a-zA-Z]+\b', text)
    
    def _split_paragraphs(self, text: str) -> List[str]:
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
    
    def _std_dev(self, values: List[float]) -> float:
        if not values:
            return 0
        mean = sum(values) / len(values)
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        return variance ** 0.5
    
    def _variance(self, values: List[float]) -> float:
        if not values:
            return 0
        mean = sum(values) / len(values)
        return sum((v - mean) ** 2 for v in values) / len(values)
    
    def _count_passive_voice(self, text: str, sentences: List[str]) -> int:
        count = 0
        for sentence in sentences:
            for indicator in self.passive_indicators:
                pattern = rf'\b{indicator}\s+\w+ed\b'
                if re.search(pattern, sentence.lower()):
                    count += 1
                    break
        return count
    
    def _calculate_vocabulary_complexity(self, words: List[str]) -> float:
        if not words:
            return 0
        
        unique_words = set(w.lower() for w in words)
        ttr = len(unique_words) / len(words)
        
        uncommon_count = sum(1 for w in unique_words if w not in self.common_words)
        uncommon_ratio = uncommon_count / len(unique_words) if unique_words else 0
        
        word_lengths = [len(w) for w in words]
        avg_length = sum(word_lengths) / len(word_lengths) if word_lengths else 0
        length_factor = min(1, avg_length / 8)
        
        return 0.4 * ttr + 0.4 * uncommon_ratio + 0.2 * length_factor
    
    def _calculate_dialogue_percentage(self, text: str) -> float:
        dialogue_chars = 0
        in_quotes = False
        
        for char in text:
            if char in '"\'':
                in_quotes = not in_quotes
            elif in_quotes:
                dialogue_chars += 1
        
        total_chars = len(text)
        return dialogue_chars / total_chars if total_chars else 0
    
    def _calculate_narrative_density(self, text: str) -> float:
        action_verbs = [
            'ran', 'walked', 'jumped', 'fell', 'rose', 'turned', 'moved', 'spoke',
            'said', 'shouted', 'whispered', 'cried', 'laughed', 'smiled', 'frowned',
            'opened', 'closed', 'entered', 'left', 'arrived', 'departed', 'returned',
            'grabbed', 'threw', 'caught', 'hit', 'missed', 'struck', 'blocked',
            'fought', 'fled', 'chased', 'followed', 'led', 'guided', 'pushed', 'pulled',
        ]
        
        words = self._split_words(text.lower())
        action_count = sum(1 for w in words if w in action_verbs)
        
        return action_count / len(words) if words else 0
    
    def _count_adverbs(self, words: List[str]) -> int:
        count = 0
        for word in words:
            if word.lower().endswith('ly') and len(word) > 3:
                if word.lower() not in {'only', 'family', 'illy', 'belly'}:
                    count += 1
        return count
    
    def _count_rhetorical_questions(self, sentences: List[str]) -> int:
        count = 0
        for sentence in sentences:
            if '?' in sentence:
                question_words = {'who', 'what', 'where', 'when', 'why', 'how'}
                words = set(self._split_words(sentence.lower()))
                if words & question_words:
                    continue
                count += 1
        return count
    
    def compare_to_archetype(self, metrics: StyleMetrics, archetype: str) -> dict:
        if archetype not in self.archetypes:
            return {"error": f"Unknown archetype: {archetype}"}
        
        target = self.archetypes[archetype]
        
        differences = {}
        match_scores = []
        
        for key in ['sentence_length_mean', 'passive_voice_ratio', 'vocabulary_complexity', 'dialogue_percentage', 'adverb_usage_rate']:
            if key in target:
                actual = getattr(metrics, key, 0)
                expected = target[key]
                diff = actual - expected
                differences[key] = {
                    'actual': actual,
                    'expected': expected,
                    'difference': round(diff, 3)
                }
                
                if expected != 0:
                    match = max(0, 1 - abs(diff / expected))
                else:
                    match = 1 if actual == 0 else max(0, 1 - actual)
                match_scores.append(match)
        
        overall_match = sum(match_scores) / len(match_scores) if match_scores else 0
        
        return {
            'archetype': archetype,
            'match_percentage': round(overall_match * 100, 1),
            'differences': differences
        }
    
    def get_recommendations(self, metrics: StyleMetrics) -> List[str]:
        recommendations = []
        
        if metrics.passive_voice_ratio > 0.2:
            recommendations.append(f"Your passive voice ratio ({metrics.passive_voice_ratio:.1%}) is high. Try converting passive constructions to active voice for more engaging prose.")
        
        if metrics.adverb_usage_rate > 0.03:
            recommendations.append(f"Consider reducing adverb usage ({metrics.adverb_usage_rate:.1%}). Strong verbs often communicate more effectively than weak verbs modified by adverbs.")
        
        if metrics.sentence_length_std > 8:
            recommendations.append("Your sentence lengths vary significantly. While variety is good, consider grouping similar-length sentences for better flow.")
        
        if metrics.dialogue_percentage < 0.1 and metrics.vocabulary_complexity > 0.5:
            recommendations.append("Consider adding more dialogue to break up descriptive passages and bring characters to life.")
        
        if metrics.rhetorical_question_frequency > 0.05:
            recommendations.append("You use rhetorical questions frequently. Use them sparingly for maximum impact.")
        
        return recommendations
