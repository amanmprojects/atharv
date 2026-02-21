import re
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum


class StyleType(Enum):
    FORMAL = "formal"
    CASUAL = "casual"


@dataclass
class StyleChange:
    original: str
    replacement: str
    change_type: str
    explanation: str


class StyleEngine:
    def __init__(self):
        self.formal_to_casual = {
            r'\bI am\b': 'I\'m',
            r'\bI will\b': 'I\'ll',
            r'\bI have\b': 'I\'ve',
            r'\bI would\b': 'I\'d',
            r'\byou are\b': 'you\'re',
            r'\byou will\b': 'you\'ll',
            r'\byou have\b': 'you\'ve',
            r'\byou would\b': 'you\'d',
            r'\bwe are\b': 'we\'re',
            r'\bwe will\b': 'we\'ll',
            r'\bwe have\b': 'we\'ve',
            r'\bwe would\b': 'we\'d',
            r'\bthey are\b': 'they\'re',
            r'\bthey will\b': 'they\'ll',
            r'\bthey have\b': 'they\'ve',
            r'\bthey would\b': 'they\'d',
            r'\bit is\b': 'it\'s',
            r'\bit will\b': 'it\'ll',
            r'\bit has\b': 'it\'s',
            r'\bthat is\b': 'that\'s',
            r'\bthat will\b': 'that\'ll',
            r'\bthat has\b': 'that\'s',
            r'\bwho is\b': 'who\'s',
            r'\bwho will\b': 'who\'ll',
            r'\bwho has\b': 'who\'s',
            r'\bwhat is\b': 'what\'s',
            r'\bwhat will\b': 'what\'ll',
            r'\bwhere is\b': 'where\'s',
            r'\bwhere will\b': 'where\'ll',
            r'\bwhen is\b': 'when\'s',
            r'\bhow is\b': 'how\'s',
            r'\bthere is\b': 'there\'s',
            r'\bthere will\b': 'there\'ll',
            r'\bthere has\b': 'there\'s',
            r'\bhere is\b': 'here\'s',
            r'\bhere has\b': 'here\'s',
            r'\bis not\b': 'isn\'t',
            r'\bare not\b': 'aren\'t',
            r'\bwas not\b': 'wasn\'t',
            r'\bwere not\b': 'weren\'t',
            r'\bhave not\b': 'haven\'t',
            r'\bhas not\b': 'hasn\'t',
            r'\bhad not\b': 'hadn\'t',
            r'\bwill not\b': 'won\'t',
            r'\bwould not\b': 'wouldn\'t',
            r'\bdo not\b': 'don\'t',
            r'\bdoes not\b': 'doesn\'t',
            r'\bdid not\b': 'didn\'t',
            r'\bcannot\b': 'can\'t',
            r'\bcould not\b': 'couldn\'t',
            r'\bshould not\b': 'shouldn\'t',
            r'\bwould not\b': 'wouldn\'t',
            r'\bmight not\b': 'mightn\'t',
            r'\bmust not\b': 'mustn\'t',
        }
        
        self.casual_to_formal = {
            r"\bI'm\b": "I am",
            r"\bI'll\b": "I will",
            r"\bI've\b": "I have",
            r"\bI'd\b": "I would",
            r"\byou're\b": "you are",
            r"\byou'll\b": "you will",
            r"\byou've\b": "you have",
            r"\byou'd\b": "you would",
            r"\bwe're\b": "we are",
            r"\bwe'll\b": "we will",
            r"\bwe've\b": "we have",
            r"\bwe'd\b": "we would",
            r"\bthey're\b": "they are",
            r"\bthey'll\b": "they will",
            r"\bthey've\b": "they have",
            r"\bthey'd\b": "they would",
            r"\bit's\b": "it is",
            r"\bit'll\b": "it will",
            r"\bthat's\b": "that is",
            r"\bthat'll\b": "that will",
            r"\bwho's\b": "who is",
            r"\bwho'll\b": "who will",
            r"\bwhat's\b": "what is",
            r"\bwhat'll\b": "what will",
            r"\bwhere's\b": "where is",
            r"\bwhere'll\b": "where will",
            r"\bwhen's\b": "when is",
            r"\bhow's\b": "how is",
            r"\bthere's\b": "there is",
            r"\bthere'll\b": "there will",
            r"\bhere's\b": "here is",
            r"\bisn't\b": "is not",
            r"\baren't\b": "are not",
            r"\bwasn't\b": "was not",
            r"\bweren't\b": "were not",
            r"\bhaven't\b": "have not",
            r"\bhasn't\b": "has not",
            r"\bhadn't\b": "had not",
            r"\bwon't\b": "will not",
            r"\bwouldn't\b": "would not",
            r"\bdon't\b": "do not",
            r"\bdoesn't\b": "does not",
            r"\bdidn't\b": "did not",
            r"\bcan't\b": "cannot",
            r"\bcouldn't\b": "could not",
            r"\bshouldn't\b": "should not",
            r"\bmightn't\b": "might not",
            r"\bmustn't\b": "must not",
            r"\bgonna\b": "going to",
            r"\bwanna\b": "want to",
            r"\bgotta\b": "got to",
            r"\bkinda\b": "kind of",
            r"\bsorta\b": "sort of",
            r"\blemme\b": "let me",
            r"\bgimme\b": "give me",
            r"\boutta\b": "out of",
            r"\bdunno\b": "don't know",
        }
        
        self.formal_words = {
            "utilize": "use",
            "facilitate": "help",
            "commence": "start",
            "terminate": "end",
            "inquire": "ask",
            "ascertain": "find out",
            "purchase": "buy",
            "require": "need",
            "assist": "help",
            "demonstrate": "show",
            "indicate": "show",
            "substantial": "large",
            "approximately": "about",
            "sufficient": "enough",
            "nevertheless": "however",
            "furthermore": "also",
            "consequently": "so",
            "additionally": "also",
            "subsequently": "later",
            "prior to": "before",
            "in order to": "to",
            "due to the fact that": "because",
            "in the event that": "if",
            "at this point in time": "now",
            "a large number of": "many",
            "the majority of": "most",
            "in close proximity to": "near",
            "with regard to": "about",
            "in spite of": "despite",
            "on a daily basis": "daily",
            "give consideration to": "consider",
            "make a decision": "decide",
            "take into consideration": "consider",
        }
    
    def transform(self, text: str, target_style: StyleType, intensity: float = 0.5) -> Tuple[str, List[StyleChange]]:
        changes = []
        
        if target_style == StyleType.CASUAL:
            transformed, changes = self._to_casual(text, intensity)
        else:
            transformed, changes = self._to_formal(text, intensity)
        
        return transformed, changes
    
    def _to_casual(self, text: str, intensity: float) -> Tuple[str, List[StyleChange]]:
        changes = []
        result = text
        
        for pattern, replacement in self.formal_to_casual.items():
            matches = list(re.finditer(pattern, result, re.IGNORECASE))
            for match in reversed(matches):
                original = match.group(0)
                if re.search(pattern, original):
                    change = StyleChange(
                        original=original,
                        replacement=replacement,
                        change_type="contraction",
                        explanation=f"Converted '{original}' to casual form '{replacement}'"
                    )
                    changes.append(change)
                    result = result[:match.start()] + replacement + result[match.end():]
        
        for formal_word, casual_word in self.formal_words.items():
            pattern = rf'\b{re.escape(formal_word)}\b'
            matches = list(re.finditer(pattern, result, re.IGNORECASE))
            for match in reversed(matches):
                original = match.group(0)
                if intensity >= 0.5:
                    change = StyleChange(
                        original=original,
                        replacement=casual_word,
                        change_type="word_simplification",
                        explanation=f"Simplified '{original}' to '{casual_word}' for casual tone"
                    )
                    changes.append(change)
                    result = result[:match.start()] + casual_word + result[match.end():]
        
        result = self._relax_sentences(result, changes, intensity)
        
        return result, changes
    
    def _to_formal(self, text: str, intensity: float) -> Tuple[str, List[StyleChange]]:
        changes = []
        result = text
        
        for pattern, replacement in self.casual_to_formal.items():
            matches = list(re.finditer(pattern, result, re.IGNORECASE))
            for match in reversed(matches):
                original = match.group(0)
                change = StyleChange(
                    original=original,
                    replacement=replacement,
                    change_type="contraction_expansion",
                    explanation=f"Expanded '{original}' to formal form '{replacement}'"
                )
                changes.append(change)
                result = result[:match.start()] + replacement + result[match.end():]
        
        result = self._formalize_sentences(result, changes, intensity)
        
        return result, changes
    
    def _relax_sentences(self, text: str, changes: List[StyleChange], intensity: float) -> str:
        if intensity < 0.7:
            return text
        
        sentences = re.split(r'([.!?]+\s*)', text)
        
        result_parts = []
        for sentence in sentences:
            if not sentence.strip() or re.match(r'^[.!?]+\s*$', sentence):
                result_parts.append(sentence)
                continue
            
            relaxed = self._relax_single_sentence(sentence)
            if relaxed != sentence:
                changes.append(StyleChange(
                    original=sentence.strip(),
                    replacement=relaxed.strip(),
                    change_type="sentence_structure",
                    explanation="Relaxed sentence structure for casual tone"
                ))
            result_parts.append(relaxed)
        
        return ''.join(result_parts)
    
    def _relax_single_sentence(self, sentence: str) -> str:
        sentence = re.sub(r'\bIt is (recommended|suggested|advised) that\b', 'You might want to', sentence, flags=re.IGNORECASE)
        sentence = re.sub(r'\bPlease be advised that\b', 'Just so you know,', sentence, flags=re.IGNORECASE)
        sentence = re.sub(r'\bIt should be noted that\b', 'Note that', sentence, flags=re.IGNORECASE)
        
        return sentence
    
    def _formalize_sentences(self, text: str, changes: List[StyleChange], intensity: float) -> str:
        sentences = re.split(r'([.!?]+\s*)', text)
        
        result_parts = []
        for sentence in sentences:
            if not sentence.strip() or re.match(r'^[.!?]+\s*$', sentence):
                result_parts.append(sentence)
                continue
            
            formalized = self._formalize_single_sentence(sentence)
            if formalized != sentence:
                changes.append(StyleChange(
                    original=sentence.strip(),
                    replacement=formalized.strip(),
                    change_type="sentence_structure",
                    explanation="Formalized sentence structure"
                ))
            result_parts.append(formalized)
        
        return ''.join(result_parts)
    
    def _formalize_single_sentence(self, sentence: str) -> str:
        sentence = re.sub(r'\bYou might want to\b', 'It is recommended that you', sentence, flags=re.IGNORECASE)
        sentence = re.sub(r'\bJust so you know,\b', 'Please be advised that', sentence, flags=re.IGNORECASE)
        sentence = re.sub(r'\bA lot of\b', 'Many', sentence, flags=re.IGNORECASE)
        sentence = re.sub(r'\bLots of\b', 'Many', sentence, flags=re.IGNORECASE)
        sentence = re.sub(r'\bSort of\b', 'Somewhat', sentence, flags=re.IGNORECASE)
        sentence = re.sub(r'\bKind of\b', 'Somewhat', sentence, flags=re.IGNORECASE)
        
        return sentence
    
    def get_style_analysis(self, text: str) -> Dict[str, Any]:
        contraction_count = 0
        for pattern in self.casual_to_formal.keys():
            matches = re.findall(pattern, text, re.IGNORECASE)
            contraction_count += len(matches)
        
        formal_word_count = 0
        for formal_word in self.formal_words.keys():
            pattern = rf'\b{re.escape(formal_word)}\b'
            matches = re.findall(pattern, text, re.IGNORECASE)
            formal_word_count += len(matches)
        
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        
        sentences_with_passive = 0
        for sentence in sentences:
            if re.search(r'\b(was|were|is|are|been|being)\s+\w+ed\b', sentence, re.IGNORECASE):
                sentences_with_passive += 1
        
        passive_ratio = sentences_with_passive / len(sentences) if sentences else 0
        
        if contraction_count > len(sentences) * 0.5:
            current_style = "casual"
        elif formal_word_count > len(sentences) * 0.3 or avg_sentence_length > 20:
            current_style = "formal"
        else:
            current_style = "neutral"
        
        return {
            "current_style": current_style,
            "contraction_count": contraction_count,
            "formal_word_count": formal_word_count,
            "average_sentence_length": round(avg_sentence_length, 1),
            "passive_voice_ratio": round(passive_ratio, 2),
            "formality_score": self._calculate_formality_score(
                contraction_count, formal_word_count, avg_sentence_length, passive_ratio
            )
        }
    
    def _calculate_formality_score(
        self, contractions: int, formal_words: int, avg_length: float, passive_ratio: float
    ) -> float:
        score = 50.0
        
        score -= contractions * 3
        score += formal_words * 5
        
        if avg_length > 20:
            score += (avg_length - 20) * 1.5
        elif avg_length < 10:
            score -= (10 - avg_length) * 2
        
        score += passive_ratio * 20
        
        return max(0, min(100, round(score, 1)))
