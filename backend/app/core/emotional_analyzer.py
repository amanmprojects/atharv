import re
from typing import List, Dict, Tuple, Optional
from collections import defaultdict
from dataclasses import dataclass
import math

@dataclass
class EmotionResult:
    paragraph: int
    emotions: Dict[str, float]
    dominant_emotion: str
    intensity: float

class EmotionalFlowAnalyzer:
    def __init__(self):
        self.emotion_lexicon = self._build_emotion_lexicon()
        self.emotion_categories = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'anticipation', 'trust']
        self.modifiers = {
            'very': 1.5, 'extremely': 2.0, 'really': 1.3, 'quite': 1.2,
            'somewhat': 0.7, 'slightly': 0.5, 'a bit': 0.6, 'barely': 0.4,
            'not': -1, "n't": -1, 'never': -1
        }
        self.negation_words = {'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', 'none'}
    
    def _build_emotion_lexicon(self) -> Dict[str, Dict[str, float]]:
        lexicon = {
            'joy': {
                'happy': 0.9, 'joy': 1.0, 'delighted': 0.9, 'pleased': 0.8, 'thrilled': 0.95,
                'excited': 0.85, 'cheerful': 0.8, 'glad': 0.75, 'content': 0.7, 'satisfied': 0.7,
                'elated': 0.95, 'ecstatic': 1.0, 'overjoyed': 0.95, 'blissful': 0.9, 'jubilant': 0.9,
                'wonderful': 0.8, 'amazing': 0.8, 'fantastic': 0.8, 'great': 0.7, 'good': 0.6,
                'smile': 0.7, 'laugh': 0.75, 'grin': 0.7, 'beam': 0.75, 'chuckle': 0.65,
                'love': 0.85, 'adore': 0.85, 'cherish': 0.8, 'treasure': 0.75,
                'celebrate': 0.8, 'triumph': 0.85, 'victory': 0.8, 'success': 0.75,
            },
            'sadness': {
                'sad': 0.9, 'sorrow': 0.95, 'grief': 0.95, 'depressed': 0.9, 'melancholy': 0.85,
                'unhappy': 0.8, 'miserable': 0.9, 'heartbroken': 0.95, 'devastated': 0.95,
                'cry': 0.8, 'weep': 0.85, 'sob': 0.9, 'tear': 0.75, 'tears': 0.8,
                'lonely': 0.85, 'alone': 0.7, 'isolated': 0.75, 'abandoned': 0.85,
                'disappointed': 0.75, 'disheartened': 0.8, 'despair': 0.9, 'hopeless': 0.85,
                'loss': 0.8, 'lost': 0.75, 'miss': 0.7, 'missed': 0.7,
                'tragic': 0.85, 'tragedy': 0.9, 'funeral': 0.85, 'death': 0.8,
            },
            'anger': {
                'angry': 0.9, 'furious': 0.95, 'rage': 1.0, 'mad': 0.8, 'irritated': 0.7,
                'annoyed': 0.7, 'frustrated': 0.75, 'enraged': 0.95, 'outraged': 0.9,
                'hate': 0.85, 'hatred': 0.9, 'hostile': 0.8, 'aggressive': 0.75,
                'shout': 0.7, 'yell': 0.7, 'scream': 0.75, 'roar': 0.8,
                'violent': 0.85, 'violence': 0.8, 'fight': 0.65, 'battle': 0.6,
                'bitter': 0.7, 'resentful': 0.75, 'vindictive': 0.8,
                'betrayed': 0.8, 'betrayal': 0.85,
            },
            'fear': {
                'afraid': 0.9, 'scared': 0.85, 'terrified': 0.95, 'frightened': 0.85,
                'fear': 0.9, 'dread': 0.85, 'horror': 0.9, 'panic': 0.9,
                'anxious': 0.75, 'anxiety': 0.8, 'nervous': 0.7, 'worried': 0.7,
                'tremble': 0.8, 'shiver': 0.75, 'shudder': 0.75, 'shake': 0.65,
                'nightmare': 0.85, 'danger': 0.75, 'threat': 0.75, 'threaten': 0.8,
                'creepy': 0.7, 'eerie': 0.75, 'spooky': 0.7, 'haunted': 0.8,
                'escape': 0.65, 'flee': 0.7, 'run': 0.5, 'hide': 0.6,
            },
            'surprise': {
                'surprised': 0.9, 'shocked': 0.9, 'amazed': 0.85, 'astonished': 0.9,
                'stunned': 0.85, 'unexpected': 0.7, 'sudden': 0.6, 'suddenly': 0.65,
                'wow': 0.8, 'gasp': 0.75, 'startled': 0.8,
                'discover': 0.6, 'reveal': 0.65, 'revelation': 0.7, 'secret': 0.5,
                'twist': 0.7, 'turn': 0.5, 'change': 0.4,
            },
            'disgust': {
                'disgusted': 0.9, 'revolted': 0.9, 'repulsed': 0.9, 'nauseated': 0.85,
                'gross': 0.8, 'yuck': 0.85, 'eww': 0.9, 'nasty': 0.75,
                'vile': 0.85, 'disgusting': 0.9, 'repulsive': 0.85, 'repugnant': 0.85,
                'sick': 0.75, 'ill': 0.6, 'rotten': 0.8, 'decaying': 0.8,
                'slime': 0.75, 'filth': 0.85, 'dirty': 0.7,
            },
            'anticipation': {
                'excited': 0.8, 'eager': 0.85, 'expect': 0.7, 'await': 0.75,
                'hope': 0.75, 'hopeful': 0.8, 'anticipate': 0.8, 'look forward': 0.85,
                'future': 0.5, 'coming': 0.55, 'soon': 0.6, 'tomorrow': 0.55,
                'plan': 0.6, 'prepare': 0.6, 'ready': 0.6, 'waiting': 0.65,
                'curious': 0.7, 'wonder': 0.65, 'mystery': 0.6,
            },
            'trust': {
                'trust': 0.9, 'trustworthy': 0.85, 'reliable': 0.8, 'faithful': 0.85,
                'believe': 0.75, 'faith': 0.85, 'confidence': 0.75, 'confident': 0.8,
                'loyal': 0.85, 'devoted': 0.8, 'dedicated': 0.75,
                'honest': 0.8, 'truthful': 0.8, 'sincere': 0.75, 'genuine': 0.75,
                'safe': 0.7, 'secure': 0.75, 'protected': 0.7,
                'friend': 0.7, 'ally': 0.75, 'partner': 0.7, 'support': 0.65,
            }
        }
        return lexicon
    
    def analyze_paragraph(self, text: str, paragraph_idx: int) -> EmotionResult:
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        
        emotion_scores = {cat: 0.0 for cat in self.emotion_categories}
        word_count = len(words)
        
        negation_active = False
        
        for i, word in enumerate(words):
            if word in self.negation_words:
                negation_active = True
                continue
            
            multiplier = 1.0
            if i > 0 and words[i-1] in self.modifiers:
                multiplier = self.modifiers[words[i-1]]
            
            for emotion, word_scores in self.emotion_lexicon.items():
                if word in word_scores:
                    score = word_scores[word] * multiplier
                    if negation_active:
                        score *= -0.5
                    emotion_scores[emotion] += score
            
            if word not in {'very', 'extremely', 'really', 'quite', 'somewhat', 'slightly', 'a', 'bit'}:
                negation_active = False
        
        if word_count > 0:
            for emotion in emotion_scores:
                emotion_scores[emotion] = max(0, min(1, emotion_scores[emotion] / (word_count * 0.1)))
        
        total = sum(emotion_scores.values())
        if total > 0:
            for emotion in emotion_scores:
                emotion_scores[emotion] = round(emotion_scores[emotion] / total, 3)
        
        dominant_emotion = max(emotion_scores.keys(), key=lambda k: emotion_scores[k])
        intensity = emotion_scores[dominant_emotion]
        
        return EmotionResult(
            paragraph=paragraph_idx,
            emotions=emotion_scores,
            dominant_emotion=dominant_emotion if intensity > 0.1 else 'neutral',
            intensity=round(intensity, 3)
        )
    
    def analyze_document(self, text: str) -> dict:
        paragraphs = self._split_paragraphs(text)
        
        emotion_timeline = []
        for idx, para in enumerate(paragraphs):
            result = self.analyze_paragraph(para, idx)
            emotion_timeline.append(result)
        
        arc_shape = self._determine_arc_shape(emotion_timeline)
        flat_zones = self._detect_flat_zones(emotion_timeline)
        pacing_scores = self._calculate_pacing(paragraphs, emotion_timeline)
        
        return {
            "arc_shape": arc_shape,
            "flat_zones": flat_zones,
            "pacing_scores": pacing_scores,
            "emotion_timeline": [
                {
                    "paragraph": e.paragraph,
                    "emotions": e.emotions,
                    "dominant_emotion": e.dominant_emotion,
                    "intensity": e.intensity
                }
                for e in emotion_timeline
            ],
            "statistics": {
                "avg_intensity": round(sum(e.intensity for e in emotion_timeline) / len(emotion_timeline), 3) if emotion_timeline else 0,
                "emotion_distribution": self._get_emotion_distribution(emotion_timeline)
            }
        }
    
    def _split_paragraphs(self, text: str) -> List[str]:
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
    
    def _determine_arc_shape(self, timeline: List[EmotionResult]) -> str:
        if len(timeline) < 2:
            return "unknown"
        
        positive_emotions = {'joy', 'anticipation', 'trust', 'surprise'}
        negative_emotions = {'sadness', 'anger', 'fear', 'disgust'}
        
        scores = []
        for e in timeline:
            pos = sum(e.emotions.get(em, 0) for em in positive_emotions)
            neg = sum(e.emotions.get(em, 0) for em in negative_emotions)
            scores.append(pos - neg)
        
        if not scores:
            return "flat"
        
        first_half = scores[:len(scores)//2]
        second_half = scores[len(scores)//2:]
        
        avg_first = sum(first_half) / len(first_half) if first_half else 0
        avg_second = sum(second_half) / len(second_half) if second_half else 0
        
        if avg_first < avg_second - 0.1:
            return "rising"
        elif avg_first > avg_second + 0.1:
            return "falling"
        elif abs(avg_first - avg_second) <= 0.1 and all(abs(s - scores[0]) < 0.2 for s in scores):
            return "flat"
        else:
            variance = sum((s - sum(scores)/len(scores))**2 for s in scores) / len(scores)
            if variance > 0.1:
                return "oscillating"
            return "steady"
    
    def _detect_flat_zones(self, timeline: List[EmotionResult]) -> List[dict]:
        flat_zones = []
        consecutive_flat = []
        
        for e in timeline:
            if e.intensity < 0.2 or e.dominant_emotion == 'neutral':
                consecutive_flat.append(e.paragraph)
            else:
                if len(consecutive_flat) >= 3:
                    flat_zones.append({
                        "paragraphs": consecutive_flat.copy(),
                        "dominant_emotion": "neutral",
                        "suggestion": f"This section maintains a flat emotional tone for {len(consecutive_flat)} paragraphs. Consider introducing tension or a turning point."
                    })
                consecutive_flat = []
        
        if len(consecutive_flat) >= 3:
            flat_zones.append({
                "paragraphs": consecutive_flat,
                "dominant_emotion": "neutral",
                "suggestion": f"This section maintains a flat emotional tone for {len(consecutive_flat)} paragraphs. Consider introducing tension or a turning point."
            })
        
        return flat_zones
    
    def _calculate_pacing(self, paragraphs: List[str], timeline: List[EmotionResult]) -> List[float]:
        pacing_scores = []
        
        for i, para in enumerate(paragraphs):
            sentences = re.split(r'[.!?]+', para)
            sentence_count = len([s for s in sentences if s.strip()])
            word_count = len(re.findall(r'\b\w+\b', para))
            
            emotion_intensity = timeline[i].intensity if i < len(timeline) else 0.5
            
            sentence_length_factor = min(1, abs(sentence_count - 3) / 5)
            word_factor = min(1, word_count / 200)
            
            pacing = 0.4 * (1 - sentence_length_factor) + 0.3 * word_factor + 0.3 * emotion_intensity
            pacing_scores.append(round(pacing, 2))
        
        return pacing_scores
    
    def _get_emotion_distribution(self, timeline: List[EmotionResult]) -> dict:
        distribution = {cat: 0 for cat in self.emotion_categories}
        distribution['neutral'] = 0
        
        for e in timeline:
            if e.dominant_emotion in distribution:
                distribution[e.dominant_emotion] += 1
        
        total = sum(distribution.values())
        if total > 0:
            for k in distribution:
                distribution[k] = round(distribution[k] / total, 3)
        
        return distribution
