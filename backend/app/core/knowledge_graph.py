"""
MODULE 5: Knowledge Graph & Narrative Memory
Builds structured graphs of entities, relationships, and events from documents.
"""
import re
from typing import List, Dict, Optional, Set, Tuple
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class Entity:
    name: str
    entity_type: str  # 'character', 'location', 'organization', 'object', 'concept'
    mentions: List[dict] = field(default_factory=list)
    attributes: Dict[str, str] = field(default_factory=dict)
    first_paragraph: int = 0
    frequency: int = 0


@dataclass
class Relationship:
    source: str
    target: str
    relationship_type: str  # 'ally', 'enemy', 'sibling', 'mentor', 'colleague', etc.
    weight: float = 1.0
    paragraphs: List[int] = field(default_factory=list)
    evidence: List[str] = field(default_factory=list)


@dataclass
class GraphEvent:
    description: str
    paragraph: int
    entities_involved: List[str] = field(default_factory=list)
    temporal_marker: Optional[str] = None
    event_type: str = "general"  # 'action', 'dialogue', 'description', 'transition'


@dataclass
class KnowledgeGraphResult:
    entities: List[Dict]
    relationships: List[Dict]
    events: List[Dict]
    entity_frequency_map: Dict[str, List[int]]  # entity -> list of paragraph indices
    orphaned_entities: List[str]  # entities mentioned once then never again
    central_entities: List[str]  # most connected entities
    graph_stats: Dict[str, int]


class KnowledgeGraphEngine:
    def __init__(self):
        self.relationship_indicators = {
            'positive': {
                'ally': ['helped', 'supported', 'saved', 'protected', 'aided', 'assisted', 'defended'],
                'friend': ['friend', 'companion', 'buddy', 'pal', 'confidant', 'trusted'],
                'lover': ['loved', 'kissed', 'embraced', 'adored', 'cherished', 'married', 'wedding'],
                'family': ['brother', 'sister', 'mother', 'father', 'son', 'daughter', 'parent', 'child',
                          'uncle', 'aunt', 'cousin', 'grandfather', 'grandmother', 'sibling', 'family'],
                'mentor': ['taught', 'trained', 'mentored', 'guided', 'instructed', 'educated'],
                'colleague': ['worked with', 'collaborated', 'partnered', 'colleague', 'coworker'],
            },
            'negative': {
                'enemy': ['fought', 'attacked', 'betrayed', 'opposed', 'hated', 'despised', 'killed'],
                'rival': ['competed', 'rivaled', 'challenged', 'confronted', 'rival'],
                'victim': ['hurt', 'harmed', 'injured', 'wounded', 'tortured', 'abused'],
            },
            'neutral': {
                'acquaintance': ['met', 'knew', 'recognized', 'encountered', 'introduced'],
                'observed': ['watched', 'observed', 'noticed', 'saw', 'witnessed'],
            }
        }

        self.location_indicators = [
            r'\b(?:in|at|near|outside|inside|within|around|across|beyond|beneath)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:city|town|village|castle|forest|mountain|river|ocean|lake|island)',
        ]

        self.organization_indicators = [
            r'\b(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Corporation|Inc|Ltd|Company|Agency|Department|Ministry|Guild|Order|Council|Committee)',
        ]

        self.event_indicators = [
            r'\b(suddenly|then|afterwards|meanwhile|finally|eventually|immediately)\b',
            r'\b(began|started|ended|finished|completed|concluded|initiated)\b',
            r'\b(attacked|discovered|revealed|escaped|arrived|departed|returned)\b',
        ]

        self.title_words = {'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sir', 'Lady', 'Lord',
                           'King', 'Queen', 'Prince', 'Princess', 'Captain', 'General',
                           'Detective', 'Agent', 'Officer', 'Commander'}

    def analyze(self, text: str) -> Dict:
        paragraphs = self._split_paragraphs(text)
        
        # Extract entities
        entities = self._extract_entities(paragraphs)
        
        # Build relationships
        relationships = self._extract_relationships(paragraphs, entities)
        
        # Extract events
        events = self._extract_events(paragraphs, entities)
        
        # Build frequency map
        frequency_map = self._build_frequency_map(entities, paragraphs)
        
        # Find orphaned entities (mentioned only in one paragraph)
        orphaned = self._find_orphaned_entities(frequency_map)
        
        # Find central entities (most relationships)
        central = self._find_central_entities(relationships, entities)
        
        # Graph statistics
        stats = {
            "total_entities": len(entities),
            "total_relationships": len(relationships),
            "total_events": len(events),
            "entity_types": self._count_entity_types(entities),
            "avg_connections_per_entity": len(relationships) * 2 / max(len(entities), 1),
        }
        
        return {
            "entities": [self._entity_to_dict(e) for e in entities.values()],
            "relationships": [self._relationship_to_dict(r) for r in relationships],
            "events": [self._event_to_dict(e) for e in events],
            "entity_frequency_map": frequency_map,
            "orphaned_entities": orphaned,
            "central_entities": central,
            "graph_stats": stats,
        }

    def _split_paragraphs(self, text: str) -> List[str]:
        paragraphs = re.split(r'\n\s*\n', text)
        return [p.strip() for p in paragraphs if p.strip()]

    def _extract_entities(self, paragraphs: List[str]) -> Dict[str, Entity]:
        entities: Dict[str, Entity] = {}

        for para_idx, para in enumerate(paragraphs):
            # Extract names (capitalized word sequences)
            names = self._extract_proper_nouns(para)
            for name in names:
                canonical = self._canonicalize_name(name)
                if canonical not in entities:
                    entities[canonical] = Entity(
                        name=canonical,
                        entity_type=self._classify_entity(canonical, para),
                        first_paragraph=para_idx,
                        frequency=1,
                        mentions=[{"paragraph": para_idx, "context": self._get_context(para, name)}]
                    )
                else:
                    entities[canonical].frequency += 1
                    entities[canonical].mentions.append(
                        {"paragraph": para_idx, "context": self._get_context(para, name)}
                    )

            # Extract locations
            for pattern in self.location_indicators:
                for match in re.finditer(pattern, para):
                    loc_name = match.group(1).strip()
                    if len(loc_name) > 1 and loc_name not in {'The', 'A', 'An', 'In', 'At', 'On'}:
                        if loc_name not in entities:
                            entities[loc_name] = Entity(
                                name=loc_name,
                                entity_type='location',
                                first_paragraph=para_idx,
                                frequency=1,
                                mentions=[{"paragraph": para_idx, "context": self._get_context(para, loc_name)}]
                            )
                        else:
                            entities[loc_name].frequency += 1

        return entities

    def _extract_proper_nouns(self, text: str) -> List[str]:
        """Extract capitalized word sequences that are likely proper nouns."""
        names = set()
        
        # Match Title + Name patterns
        for title in self.title_words:
            pattern = rf'\b{title}\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b'
            for match in re.finditer(pattern, text):
                full_name = f"{title} {match.group(1)}"
                names.add(full_name)

        # Match capitalized word sequences (2+ words likely a name)
        for match in re.finditer(r'\b([A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20})+)\b', text):
            candidate = match.group(1)
            # Filter out sentence starts and common phrases
            if not self._is_sentence_start(text, match.start()):
                names.add(candidate)

        # Single capitalized words that appear multiple times
        for match in re.finditer(r'\b([A-Z][a-z]{2,15})\b', text):
            candidate = match.group(1)
            if not self._is_sentence_start(text, match.start()) and candidate not in {
                'The', 'This', 'That', 'These', 'Those', 'What', 'Where', 'When',
                'Who', 'Why', 'How', 'But', 'And', 'Yet', 'For', 'Not', 'All',
                'Her', 'His', 'Its', 'Our', 'May', 'Can', 'Will', 'She', 'has',
                'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
                'January', 'February', 'March', 'April', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'
            }:
                names.add(candidate)

        return list(names)

    def _is_sentence_start(self, text: str, pos: int) -> bool:
        if pos == 0:
            return True
        before = text[:pos].rstrip()
        return before and before[-1] in '.!?'

    def _canonicalize_name(self, name: str) -> str:
        return name.strip()

    def _classify_entity(self, name: str, context: str) -> str:
        name_lower = name.lower()
        context_lower = context.lower()

        # Check if it's a title + name (character)
        for title in self.title_words:
            if name.startswith(title):
                return 'character'

        # Check organization patterns
        for pattern in self.organization_indicators:
            if re.search(pattern, name):
                return 'organization'

        # Check if used with character-like verbs
        character_verbs = ['said', 'spoke', 'replied', 'asked', 'thought', 'felt', 'walked',
                          'ran', 'looked', 'smiled', 'laughed', 'cried', 'whispered', 'shouted']
        for verb in character_verbs:
            if re.search(rf'\b{re.escape(name)}\b\s+{verb}', context) or \
               re.search(rf'{verb}\s+\b{re.escape(name)}\b', context):
                return 'character'

        # Check if location-like
        location_words = ['city', 'town', 'village', 'castle', 'forest', 'mountain',
                         'river', 'ocean', 'island', 'country', 'kingdom', 'land', 'realm']
        for loc in location_words:
            if loc in context_lower:
                return 'location'

        return 'character'  # default assumption

    def _get_context(self, text: str, entity: str, window: int = 60) -> str:
        idx = text.find(entity)
        if idx == -1:
            return text[:120]
        start = max(0, idx - window)
        end = min(len(text), idx + len(entity) + window)
        return text[start:end]

    def _extract_relationships(self, paragraphs: List[str], entities: Dict[str, Entity]) -> List[Relationship]:
        relationships: List[Relationship] = []
        relationship_set: Set[Tuple[str, str]] = set()

        entity_names = list(entities.keys())

        for para_idx, para in enumerate(paragraphs):
            para_lower = para.lower()

            # Find co-occurring entities
            present_entities = [name for name in entity_names if name.lower() in para_lower]

            for i, entity_a in enumerate(present_entities):
                for entity_b in present_entities[i + 1:]:
                    key = tuple(sorted([entity_a, entity_b]))
                    rel_type = self._infer_relationship_type(para_lower, entity_a, entity_b)

                    if key not in relationship_set:
                        relationship_set.add(key)
                        relationships.append(Relationship(
                            source=entity_a,
                            target=entity_b,
                            relationship_type=rel_type,
                            weight=1.0,
                            paragraphs=[para_idx],
                            evidence=[self._get_context(para, entity_a, 80)]
                        ))
                    else:
                        # Update existing relationship
                        for rel in relationships:
                            if (rel.source == key[0] and rel.target == key[1]) or \
                               (rel.source == key[1] and rel.target == key[0]):
                                rel.weight += 0.5
                                if para_idx not in rel.paragraphs:
                                    rel.paragraphs.append(para_idx)
                                break

        return relationships

    def _infer_relationship_type(self, text: str, entity_a: str, entity_b: str) -> str:
        text_between = text.lower()

        for category, types in self.relationship_indicators.items():
            for rel_type, indicators in types.items():
                for indicator in indicators:
                    if indicator in text_between:
                        return rel_type

        return 'associated'

    def _extract_events(self, paragraphs: List[str], entities: Dict[str, Entity]) -> List[GraphEvent]:
        events: List[GraphEvent] = []
        entity_names = list(entities.keys())

        for para_idx, para in enumerate(paragraphs):
            sentences = re.split(r'[.!?]+', para)
            for sentence in sentences:
                sentence = sentence.strip()
                if not sentence:
                    continue

                # Check if sentence contains event indicators
                is_event = False
                event_type = "general"
                for pattern in self.event_indicators:
                    if re.search(pattern, sentence, re.IGNORECASE):
                        is_event = True
                        break

                # Check for dialog
                if '"' in sentence or "'" in sentence:
                    is_event = True
                    event_type = "dialogue"

                # Check for action verbs
                action_verbs = ['attacked', 'discovered', 'revealed', 'escaped', 'arrived',
                               'departed', 'returned', 'killed', 'died', 'born', 'created',
                               'destroyed', 'built', 'found', 'lost', 'won', 'betrayed']
                for verb in action_verbs:
                    if verb in sentence.lower():
                        is_event = True
                        event_type = "action"
                        break

                if is_event:
                    involved = [name for name in entity_names if name.lower() in sentence.lower()]
                    temporal = self._find_temporal_marker(sentence)
                    events.append(GraphEvent(
                        description=sentence[:200],
                        paragraph=para_idx,
                        entities_involved=involved,
                        temporal_marker=temporal,
                        event_type=event_type
                    ))

        return events

    def _find_temporal_marker(self, text: str) -> Optional[str]:
        temporal_patterns = [
            r'\b(\d{1,2}\s*(?:hours?|days?|weeks?|months?|years?)\s*(?:later|ago|before|after))\b',
            r'\b(next\s+(?:day|week|month|year|morning|evening|night))\b',
            r'\b((?:that|the\s+following|the\s+previous)\s+(?:day|week|month|year|morning|evening|night))\b',
            r'\b(in\s+\d{4})\b',
            r'\b(on\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))\b',
        ]
        for pattern in temporal_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def _build_frequency_map(self, entities: Dict[str, Entity], paragraphs: List[str]) -> Dict[str, List[int]]:
        freq_map: Dict[str, List[int]] = {}
        for name, entity in entities.items():
            freq_map[name] = list(set(m["paragraph"] for m in entity.mentions))
        return freq_map

    def _find_orphaned_entities(self, frequency_map: Dict[str, List[int]]) -> List[str]:
        return [name for name, paras in frequency_map.items() if len(paras) == 1]

    def _find_central_entities(self, relationships: List[Relationship], entities: Dict[str, Entity]) -> List[str]:
        connection_count: Dict[str, int] = defaultdict(int)
        for rel in relationships:
            connection_count[rel.source] += 1
            connection_count[rel.target] += 1

        sorted_entities = sorted(connection_count.items(), key=lambda x: x[1], reverse=True)
        return [name for name, _ in sorted_entities[:5]]

    def _count_entity_types(self, entities: Dict[str, Entity]) -> Dict[str, int]:
        counts: Dict[str, int] = defaultdict(int)
        for entity in entities.values():
            counts[entity.entity_type] += 1
        return dict(counts)

    def _entity_to_dict(self, entity: Entity) -> Dict:
        return {
            "name": entity.name,
            "entity_type": entity.entity_type,
            "frequency": entity.frequency,
            "first_paragraph": entity.first_paragraph,
            "mentions": entity.mentions[:10],
            "attributes": entity.attributes,
        }

    def _relationship_to_dict(self, rel: Relationship) -> Dict:
        return {
            "source": rel.source,
            "target": rel.target,
            "relationship_type": rel.relationship_type,
            "weight": rel.weight,
            "paragraphs": rel.paragraphs,
            "evidence": rel.evidence[:3],
        }

    def _event_to_dict(self, event: GraphEvent) -> Dict:
        return {
            "description": event.description,
            "paragraph": event.paragraph,
            "entities_involved": event.entities_involved,
            "temporal_marker": event.temporal_marker,
            "event_type": event.event_type,
        }
