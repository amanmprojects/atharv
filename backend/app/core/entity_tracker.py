import spacy
import networkx as nx
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
import re
import uuid

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None


class EntityTracker:
    def __init__(self):
        self.nlp = nlp
        self.graph = nx.DiGraph()
        self.entities: Dict[str, Dict[str, Any]] = {}
        self.entity_mentions: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        if not self.nlp:
            return self._extract_entities_regex(text)
        
        doc = self.nlp(text)
        entities = []
        
        for ent in doc.ents:
            entity_type = self._map_entity_type(ent.label_)
            entity = {
                "id": str(uuid.uuid4())[:8],
                "name": ent.text,
                "entity_type": entity_type,
                "start": ent.start_char,
                "end": ent.end_char,
                "sentence": ent.sent.text if ent.sent else ""
            }
            entities.append(entity)
            
        return self._merge_duplicate_entities(entities)
    
    def _extract_entities_regex(self, text: str) -> List[Dict[str, Any]]:
        entities = []
        
        patterns = {
            "PERSON": [
                r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b',
                r'\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+)\b',
            ],
            "LOCATION": [
                r'\b([A-Z][a-z]+(?:\s+(?:City|Town|Village|Mountain|River|Lake|Sea|Ocean|Forest|Valley))?)\b',
            ],
            "DATE": [
                r'\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{4})?)\b',
                r'\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)\b',
            ],
        }
        
        for entity_type, pattern_list in patterns.items():
            for pattern in pattern_list:
                for match in re.finditer(pattern, text):
                    entities.append({
                        "id": str(uuid.uuid4())[:8],
                        "name": match.group(0),
                        "entity_type": entity_type.lower(),
                        "start": match.start(),
                        "end": match.end(),
                        "sentence": self._get_sentence(text, match.start())
                    })
        
        return self._merge_duplicate_entities(entities)
    
    def _get_sentence(self, text: str, pos: int) -> str:
        sentences = re.split(r'[.!?]+', text)
        current_pos = 0
        for sentence in sentences:
            if current_pos + len(sentence) >= pos:
                return sentence.strip()
            current_pos += len(sentence) + 1
        return ""
    
    def _map_entity_type(self, spacy_label: str) -> str:
        mapping = {
            "PERSON": "person",
            "ORG": "organization",
            "GPE": "location",
            "LOC": "location",
            "DATE": "date",
            "TIME": "date",
            "EVENT": "misc",
            "FAC": "location",
            "NORP": "organization",
        }
        return mapping.get(spacy_label, "misc")
    
    def _merge_duplicate_entities(self, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        merged = {}
        for entity in entities:
            name_lower = entity["name"].lower()
            if name_lower in merged:
                merged[name_lower]["mentions"].append({
                    "start": entity["start"],
                    "end": entity["end"],
                    "sentence": entity["sentence"]
                })
            else:
                merged[name_lower] = {
                    **entity,
                    "mentions": [{
                        "start": entity["start"],
                        "end": entity["end"],
                        "sentence": entity["sentence"]
                    }]
                }
        
        result = []
        for name, entity in merged.items():
            entity_copy = {k: v for k, v in entity.items() if k not in ["start", "end", "sentence"]}
            result.append(entity_copy)
        
        return result
    
    def build_entity_graph(self, text: str) -> Dict[str, Any]:
        entities = self.extract_entities(text)
        
        self.graph.clear()
        self.entities.clear()
        self.entity_mentions.clear()
        
        for entity in entities:
            entity_id = entity["id"]
            self.entities[entity_id] = {
                "id": entity_id,
                "name": entity["name"],
                "entity_type": entity["entity_type"],
                "mentions": entity["mentions"],
                "attributes": {},
                "aliases": []
            }
            self.graph.add_node(entity_id, **self.entities[entity_id])
        
        relationships = self._extract_relationships(text, entities)
        
        for rel in relationships:
            self.graph.add_edge(
                rel["source_id"],
                rel["target_id"],
                relation_type=rel["relation_type"],
                context=rel["context"]
            )
        
        return {
            "entities": list(self.entities.values()),
            "relationships": relationships
        }
    
    def _extract_relationships(self, text: str, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        relationships = []
        entity_positions = {}
        
        for entity in entities:
            for mention in entity.get("mentions", []):
                entity_positions[mention["start"]] = entity
        
        sorted_positions = sorted(entity_positions.keys())
        
        for i in range(len(sorted_positions) - 1):
            pos1 = sorted_positions[i]
            pos2 = sorted_positions[i + 1]
            entity1 = entity_positions[pos1]
            entity2 = entity_positions[pos2]
            
            if entity1["id"] != entity2["id"]:
                between_text = text[pos1:pos2]
                relation = self._detect_relation_type(between_text)
                
                if relation:
                    relationships.append({
                        "source_id": entity1["id"],
                        "target_id": entity2["id"],
                        "relation_type": relation,
                        "context": between_text[:100]
                    })
        
        return relationships
    
    def _detect_relation_type(self, text: str) -> Optional[str]:
        patterns = {
            "family": r'\b(father|mother|brother|sister|son|daughter|uncle|aunt|cousin|husband|wife)\b',
            "friendship": r'\b(friend|companion|ally|partner)\b',
            "conflict": r'\b(enemy|rival|opponent|adversary)\b',
            "location": r'\b(in|at|near|from|to|towards)\b',
            "action": r'\b(met|saw|visited|called|helped|fought|loved|hated)\b',
        }
        
        for rel_type, pattern in patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                return rel_type
        
        return None
    
    def get_entity_attributes(self, entity_name: str, text: str) -> Dict[str, Any]:
        attributes = {}
        
        attr_patterns = {
            "age": rf'{re.escape(entity_name)}[\'"]?s?\s+(?:is\s+)?(\d+)\s*(?:years?\s+old|yo)?',
            "age_alt": rf'(\d+)[-–]?year[-–]old\s+{re.escape(entity_name)}',
            "hair_color": rf'{re.escape(entity_name)}[\'"]?s?\s+(?:has\s+)?(\w+)\s+hair',
            "eye_color": rf'{re.escape(entity_name)}[\'"]?s?\s+(?:has\s+)?(\w+)\s+eyes',
            "height": rf'{re.escape(entity_name)}[\'"]?s?\s+(?:is\s+)?(\d+[\s\'\-"]*(?:feet|ft|inches|in|cm|meters?))',
        }
        
        for attr_name, pattern in attr_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                attributes[attr_name] = match.group(1)
        
        return attributes
    
    def update_entity(self, entity_id: str, attributes: Dict[str, Any]):
        if entity_id in self.entities:
            self.entities[entity_id]["attributes"].update(attributes)
