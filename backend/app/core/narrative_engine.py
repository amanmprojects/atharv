import re
from typing import List, Dict, Tuple, Optional, Set
from collections import defaultdict
from dataclasses import dataclass, field

@dataclass
class Character:
    name: str
    aliases: List[str] = field(default_factory=list)
    traits: List[str] = field(default_factory=list)
    role: Optional[str] = None
    first_mention_paragraph: int = -1
    mentions: List[dict] = field(default_factory=list)
    attributes: Dict[str, any] = field(default_factory=dict)
    
    @property
    def mention_count(self) -> int:
        return len(self.mentions)

@dataclass 
class Event:
    description: str
    paragraph: int
    temporal_marker: Optional[str] = None
    entities_involved: List[str] = field(default_factory=list)
    position_in_timeline: int = 0

@dataclass
class Relationship:
    entity_a: str
    entity_b: str
    relationship_type: str
    paragraph: int
    confidence: float = 1.0

class CharacterTracker:
    def __init__(self):
        self.characters: Dict[str, Character] = {}
        self.pronouns = {'he', 'him', 'his', 'she', 'her', 'hers', 'they', 'them', 'their', 'theirs'}
        self.title_patterns = [
            r'\b(Dr\.|Doctor|Mr\.|Mrs\.|Ms\.|Miss|Prof\.|Professor|Detective|Inspector|Agent|Captain|Major|General|Lord|Lady|Sir|Dame)\s+([A-Z][a-z]+)',
        ]
        self.character_indicators = [
            r'([A-Z][a-z]+)\s+(?:said|replied|asked|whispered|shouted|muttered|exclaimed)',
            r'(?:said|replied|asked|whispered|shouted|muttered|exclaimed)\s+([A-Z][a-z]+)',
            r'"[^"]*"\s*[,—]?\s*([A-Z][a-z]+)\s+(?:said|replied|asked)',
        ]
    
    def extract_characters(self, paragraphs: List[str]) -> Dict[str, Character]:
        for para_idx, para in enumerate(paragraphs):
            self._extract_from_paragraph(para, para_idx)
        
        self._resolve_aliases()
        return self.characters
    
    def _extract_from_paragraph(self, text: str, para_idx: int):
        for pattern in self.title_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                full_name = match.group(0)
                name = match.group(2)
                self._add_character(name, para_idx, alias=full_name)
        
        for pattern in self.character_indicators:
            matches = re.finditer(pattern, text)
            for match in matches:
                name = match.group(1)
                if name and name not in self.pronouns:
                    self._add_character(name, para_idx)
        
        capitalized = re.findall(r'\b([A-Z][a-z]{2,})\b', text)
        common_words = {'The', 'This', 'That', 'There', 'Here', 'When', 'Where', 'What', 'Why', 'How',
                       'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
                       'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                       'September', 'October', 'November', 'December', 'English', 'French', 'German'}
        
        for name in capitalized:
            if name not in common_words and name not in self.pronouns:
                self._add_character_mention(name, para_idx)
    
    def _add_character(self, name: str, para_idx: int, alias: str = None):
        if name not in self.characters:
            self.characters[name] = Character(
                name=name,
                first_mention_paragraph=para_idx,
                mentions=[{"paragraph": para_idx}]
            )
        else:
            self.characters[name].mentions.append({"paragraph": para_idx})
        
        if alias and alias != name:
            if alias not in self.characters[name].aliases:
                self.characters[name].aliases.append(alias)
    
    def _add_character_mention(self, name: str, para_idx: int):
        if name in self.characters:
            self.characters[name].mentions.append({"paragraph": para_idx})
        elif any(name in c.aliases for c in self.characters.values()):
            for c in self.characters.values():
                if name in c.aliases:
                    c.mentions.append({"paragraph": para_idx})
                    break
    
    def _resolve_aliases(self):
        alias_map = {}
        for name, char in list(self.characters.items()):
            for alias in char.aliases:
                alias_map[alias] = name
        
        for alias, canonical in alias_map.items():
            if alias in self.characters and alias != canonical:
                self.characters[canonical].mentions.extend(self.characters[alias].mentions)
                del self.characters[alias]

class TimelineTracker:
    def __init__(self):
        self.events: List[Event] = []
        self.temporal_patterns = [
            (r'\b(\d{1,2})\s*(hours?|days?|weeks?|months?|years?)\s*(later|ago|before|after)\b', 'relative'),
            (r'\b(later|then|afterwards|subsequently|meanwhile)\b', 'sequence'),
            (r'\b(on\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))\b', 'day'),
            (r'\b(in\s+(January|February|March|April|May|June|July|August|September|October|November|December))\b', 'month'),
            (r'\b(\d{4})\b', 'year'),
            (r'\b(morning|afternoon|evening|night|midnight|dawn|dusk)\b', 'time_of_day'),
        ]
    
    def extract_timeline(self, paragraphs: List[str], characters: Dict[str, Character]) -> List[Event]:
        position = 0
        
        for para_idx, para in enumerate(paragraphs):
            temporal_marker = self._find_temporal_marker(para)
            
            sentences = re.split(r'[.!?]+', para)
            for sentence in sentences:
                if sentence.strip():
                    entities = self._find_entities(sentence, characters)
                    
                    event = Event(
                        description=sentence.strip(),
                        paragraph=para_idx,
                        temporal_marker=temporal_marker,
                        entities_involved=entities,
                        position_in_timeline=position
                    )
                    self.events.append(event)
                    position += 1
        
        return self.events
    
    def _find_temporal_marker(self, text: str) -> Optional[str]:
        for pattern, marker_type in self.temporal_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None
    
    def _find_entities(self, text: str, characters: Dict[str, Character]) -> List[str]:
        found = []
        for name in characters.keys():
            if name.lower() in text.lower():
                found.append(name)
        return found
    
    def detect_anachronisms(self) -> List[dict]:
        issues = []
        relative_events = [e for e in self.events if e.temporal_marker and 'later' in e.temporal_marker.lower()]
        
        return issues

class ContradictionDetector:
    def __init__(self):
        self.negation_words = {'never', 'not', 'no', 'nobody', 'nothing', 'nowhere', 'neither', 'nor', "n't"}
        self.fact_patterns = [
            (r'(\w+)\s+(?:was|is|were|are|had|has|have)\s+(?:born|died|married|divorced)', 'life_event'),
            (r'(\w+)\s+(?:lives?|lived|works?|worked)\s+(?:in|at)\s+(\w+)', 'location'),
            (r'(\w+)\s+(?:has|had|owns?|owned)\s+(?:a|an)?\s*(\w+)', 'possession'),
            (r'(\w+)\s+(?:never|not)\s+(\w+)', 'negation'),
        ]
    
    def detect_contradictions(self, paragraphs: List[str], characters: Dict[str, Character]) -> List[dict]:
        contradictions = []
        character_facts = defaultdict(list)
        
        for para_idx, para in enumerate(paragraphs):
            for char_name in characters.keys():
                if char_name.lower() in para.lower():
                    facts = self._extract_facts(para, char_name)
                    for fact in facts:
                        character_facts[char_name].append({
                            **fact,
                            "paragraph": para_idx,
                            "text": para[:200]
                        })
        
        for char_name, facts in character_facts.items():
            for i, fact_a in enumerate(facts):
                for fact_b in facts[i+1:]:
                    contradiction = self._check_contradiction(fact_a, fact_b, char_name)
                    if contradiction:
                        contradictions.append(contradiction)
        
        return contradictions
    
    def _extract_facts(self, text: str, character: str) -> List[dict]:
        facts = []
        text_lower = text.lower()
        char_lower = character.lower()
        
        if char_lower in text_lower:
            sentences = re.split(r'[.!?]+', text)
            for sentence in sentences:
                if char_lower in sentence.lower():
                    has_negation = any(neg in sentence.lower() for neg in self.negation_words)
                    
                    location_match = re.search(rf'{char_lower}.*?(?:lives?|lived|stays?|stayed|resides?|resided)\s+(?:in|at)\s+(\w+)', sentence.lower())
                    if location_match:
                        facts.append({
                            "type": "location",
                            "value": location_match.group(1),
                            "negated": has_negation,
                            "sentence": sentence.strip()
                        })
                    
                    visit_match = re.search(rf'(?:visited?|went to|traveled? to|been to)\s+(\w+)', sentence.lower())
                    if visit_match and char_lower in sentence.lower():
                        facts.append({
                            "type": "visited",
                            "value": visit_match.group(1),
                            "negated": has_negation,
                            "sentence": sentence.strip()
                        })
        
        return facts
    
    def _check_contradiction(self, fact_a: dict, fact_b: dict, character: str) -> Optional[dict]:
        if fact_a["type"] == fact_b["type"] and fact_a.get("value") == fact_b.get("value"):
            if fact_a.get("negated") != fact_b.get("negated"):
                return {
                    "entity": character,
                    "issue_type": "contradiction",
                    "section_a": {"paragraph": fact_a["paragraph"], "text": fact_a.get("sentence", "")},
                    "section_b": {"paragraph": fact_b["paragraph"], "text": fact_b.get("sentence", "")},
                    "severity": "high",
                    "confidence": 0.85,
                    "explanation": f"Contradictory claims about {character}'s {fact_a['type']} regarding '{fact_a.get('value')}' detected across paragraphs {fact_a['paragraph']} and {fact_b['paragraph']}."
                }
        
        return None

class PersonalityDriftDetector:
    def __init__(self):
        self.emotion_words = {
            'positive': ['happy', 'joy', 'excited', 'pleased', 'delighted', 'thrilled', 'content', 'satisfied'],
            'negative': ['sad', 'angry', 'frustrated', 'disappointed', 'upset', 'worried', 'anxious', 'fearful'],
            'neutral': ['calm', 'indifferent', 'quiet', 'thoughtful', 'pensive', 'serious']
        }
        self.formality_indicators = {
            'formal': ['therefore', 'consequently', 'furthermore', 'moreover', 'nevertheless', 'accordingly'],
            'informal': ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'nope', 'cool', 'awesome']
        }
    
    def detect_drift(self, paragraphs: List[str], characters: Dict[str, Character]) -> List[dict]:
        drifts = []
        
        for char_name, char in characters.items():
            if char.mention_count < 3:
                continue
            
            character_paragraphs = []
            for para_idx, para in enumerate(paragraphs):
                if char_name.lower() in para.lower():
                    character_paragraphs.append((para_idx, para))
            
            if len(character_paragraphs) < 3:
                continue
            
            emotions = []
            formalities = []
            
            for para_idx, para in character_paragraphs:
                emotions.append(self._get_emotion_score(para, char_name))
                formalities.append(self._get_formality_score(para, char_name))
            
            emotion_variance = self._calculate_variance(emotions)
            formality_variance = self._calculate_variance(formalities)
            
            if emotion_variance > 0.5 or formality_variance > 0.4:
                drifts.append({
                    "entity": char_name,
                    "issue_type": "personality_drift",
                    "severity": "medium",
                    "confidence": min(0.75, 0.5 + emotion_variance * 0.25),
                    "explanation": f"{char_name}'s emotional tone or formality shows significant variation across the document without clear narrative justification."
                })
        
        return drifts
    
    def _get_emotion_score(self, text: str, character: str) -> float:
        text_lower = text.lower()
        pos_count = sum(1 for w in self.emotion_words['positive'] if w in text_lower)
        neg_count = sum(1 for w in self.emotion_words['negative'] if w in text_lower)
        total = pos_count + neg_count
        return (pos_count - neg_count) / max(total, 1)
    
    def _get_formality_score(self, text: str, character: str) -> float:
        text_lower = text.lower()
        formal_count = sum(1 for w in self.formality_indicators['formal'] if w in text_lower)
        informal_count = sum(1 for w in self.formality_indicators['informal'] if w in text_lower)
        total = formal_count + informal_count
        return (formal_count - informal_count) / max(total, 1)
    
    def _calculate_variance(self, values: List[float]) -> float:
        if not values:
            return 0
        mean = sum(values) / len(values)
        return sum((v - mean) ** 2 for v in values) / len(values)

class NarrativeConsistencyEngine:
    def __init__(self):
        self.character_tracker = CharacterTracker()
        self.timeline_tracker = TimelineTracker()
        self.contradiction_detector = ContradictionDetector()
        self.drift_detector = PersonalityDriftDetector()
    
    def analyze(self, text: str) -> dict:
        paragraphs = self._split_paragraphs(text)
        
        characters = self.character_tracker.extract_characters(paragraphs)
        
        events = self.timeline_tracker.extract_timeline(paragraphs, characters)
        
        contradictions = self.contradiction_detector.detect_contradictions(paragraphs, characters)
        
        drifts = self.drift_detector.detect_drift(paragraphs, characters)
        
        all_issues = contradictions + drifts
        
        return {
            "characters": [
                {
                    "name": c.name,
                    "aliases": c.aliases,
                    "traits": c.traits,
                    "role": c.role,
                    "first_mention_paragraph": c.first_mention_paragraph,
                    "mention_count": c.mention_count
                }
                for c in characters.values()
                if c.mention_count >= 1
            ],
            "events": [
                {
                    "description": e.description[:100],
                    "paragraph": e.paragraph,
                    "temporal_marker": e.temporal_marker,
                    "entities_involved": e.entities_involved
                }
                for e in events[:50]
            ],
            "issues": all_issues,
            "statistics": {
                "character_count": len(characters),
                "event_count": len(events),
                "issue_count": len(all_issues)
            }
        }
    
    def _split_paragraphs(self, text: str) -> List[str]:
        import re
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]
