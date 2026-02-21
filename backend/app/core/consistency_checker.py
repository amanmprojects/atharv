import re
from typing import List, Dict, Any, Tuple
from collections import defaultdict


class ConsistencyChecker:
    def __init__(self):
        self.entity_states: Dict[str, Dict[str, Any]] = defaultdict(dict)
        self.warnings: List[Dict[str, Any]] = []
    
    def check_consistency(self, text: str, entities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        self.warnings = []
        
        self._check_name_consistency(entities)
        self._check_attribute_consistency(text, entities)
        self._check_pronoun_references(text, entities)
        self._check_temporal_consistency(text, entities)
        
        return self.warnings
    
    def _check_name_consistency(self, entities: List[Dict[str, Any]]):
        name_variants = defaultdict(list)
        
        for entity in entities:
            name = entity.get("name", "")
            name_lower = name.lower()
            
            name_variants[name_lower].append(entity)
            
            parts = name.split()
            for part in parts:
                if len(part) > 2:
                    name_variants[part.lower()].append(entity)
        
        for base_name, variants in name_variants.items():
            unique_names = set(e["name"] for e in variants)
            if len(unique_names) > 1:
                self.warnings.append({
                    "entity_id": variants[0]["id"],
                    "entity_name": variants[0]["name"],
                    "warning_type": "name_variant",
                    "description": f"Multiple name variants detected: {', '.join(unique_names)}. Consider using consistent naming.",
                    "locations": [
                        {"name": e["name"], "mentions": e.get("mentions", [])}
                        for e in variants
                    ],
                    "severity": "low"
                })
    
    def _check_attribute_consistency(self, text: str, entities: List[Dict[str, Any]]):
        for entity in entities:
            entity_name = entity.get("name", "")
            if not entity_name:
                continue
            
            attributes = self._extract_entity_attributes(text, entity_name)
            
            entity_key = entity["id"]
            
            for attr_name, attr_value in attributes.items():
                if attr_name in self.entity_states[entity_key]:
                    stored_value = self.entity_states[entity_key][attr_name]
                    if stored_value.lower() != attr_value.lower():
                        self.warnings.append({
                            "entity_id": entity["id"],
                            "entity_name": entity_name,
                            "warning_type": "attribute_contradiction",
                            "description": f"Inconsistent {attr_name} for {entity_name}: previously '{stored_value}', now '{attr_value}'",
                            "locations": [
                                {"attribute": attr_name, "values": [stored_value, attr_value]}
                            ],
                            "severity": "high"
                        })
                else:
                    self.entity_states[entity_key][attr_name] = attr_value
    
    def _extract_entity_attributes(self, text: str, entity_name: str) -> Dict[str, str]:
        attributes = {}
        
        patterns = {
            "hair_color": rf'{re.escape(entity_name)}[\'"]?s?\s+(?:has\s+)?(\w+)\s+hair',
            "eye_color": rf'{re.escape(entity_name)}[\'"]?s?\s+(?:has\s+)?(\w+)\s+eyes',
            "age": rf'{re.escape(entity_name)}[\'"]?s?\s+(?:is\s+)?(\d+)\s*(?:years?\s+old)?',
            "gender": rf'{re.escape(entity_name)}[\'"]?s?\s+(?:is\s+)?(?:a\s+)?(\w+)(?:\s+woman|\s+man|\s+girl|\s+boy|\s+person)',
        }
        
        colors = ['black', 'white', 'brown', 'blonde', 'red', 'ginger', 'gray', 'grey', 
                  'blue', 'green', 'hazel', 'amber', 'dark', 'light', 'auburn']
        
        for attr_name, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).lower()
                if attr_name in ["hair_color", "eye_color"]:
                    if value in colors:
                        attributes[attr_name] = value
                else:
                    attributes[attr_name] = value
        
        return attributes
    
    def _check_pronoun_references(self, text: str, entities: List[Dict[str, Any]]):
        pronouns = ['he', 'she', 'it', 'they', 'him', 'her', 'them', 'his', 'hers', 'its', 'their']
        
        sentences = re.split(r'[.!?]+', text)
        
        last_entities = []
        
        for i, sentence in enumerate(sentences):
            sentence_entities = []
            for entity in entities:
                if entity.get("name", "").lower() in sentence.lower():
                    sentence_entities.append(entity)
            
            pronouns_in_sentence = []
            for pronoun in pronouns:
                pattern = rf'\b{pronoun}\b'
                matches = list(re.finditer(pattern, sentence, re.IGNORECASE))
                for match in matches:
                    pronouns_in_sentence.append({
                        "pronoun": pronoun,
                        "position": match.start()
                    })
            
            if pronouns_in_sentence and not sentence_entities and not last_entities:
                self.warnings.append({
                    "entity_id": "unknown",
                    "entity_name": "Unknown",
                    "warning_type": "ambiguous_pronoun",
                    "description": f"Ambiguous pronoun reference in sentence {i+1}. No clear antecedent found.",
                    "locations": [{"sentence_index": i, "pronouns": [p["pronoun"] for p in pronouns_in_sentence]}],
                    "severity": "medium"
                })
            
            if sentence_entities:
                last_entities = sentence_entities
    
    def _check_temporal_consistency(self, text: str, entities: List[Dict[str, Any]]):
        time_indicators = {
            "before": ["earlier", "previously", "before", "yesterday", "last week", "last month"],
            "after": ["later", "afterwards", "after", "tomorrow", "next week", "next month"],
            "present": ["now", "today", "currently", "at this moment"]
        }
        
        sentences = re.split(r'[.!?]+', text)
        
        timeline = []
        
        for i, sentence in enumerate(sentences):
            time_markers = []
            for period, indicators in time_indicators.items():
                for indicator in indicators:
                    if indicator in sentence.lower():
                        time_markers.append(period)
                        break
            
            if time_markers:
                timeline.append({
                    "sentence_index": i,
                    "time_markers": time_markers,
                    "sentence": sentence.strip()[:100]
                })
        
        if len(timeline) > 1:
            for i in range(len(timeline) - 1):
                current = timeline[i]
                next_item = timeline[i + 1]
                
                if "before" in current["time_markers"] and "after" in next_item["time_markers"]:
                    continue
                if "after" in current["time_markers"] and "before" in next_item["time_markers"]:
                    self.warnings.append({
                        "entity_id": "temporal",
                        "entity_name": "Timeline",
                        "warning_type": "temporal_inconsistency",
                        "description": f"Possible temporal inconsistency: '{current['sentence'][:50]}...' followed by '{next_item['sentence'][:50]}...'",
                        "locations": [
                            {"sentence_index": current["sentence_index"]},
                            {"sentence_index": next_item["sentence_index"]}
                        ],
                        "severity": "low"
                    })
    
    def add_custom_rule(self, rule_name: str, check_function):
        pass
