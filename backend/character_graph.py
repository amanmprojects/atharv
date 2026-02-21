"""
DevHacks 2026 - Challenge 2: AI-Powered Writer
File: character_graph.py - Character state tracking and contradiction detection
"""

import re
from collections import defaultdict

import networkx as nx

try:
    import spacy
except ImportError:
    spacy = None

# Optional spaCy model. The module still works without it.
if spacy is not None:
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        print("spaCy model not found. Falling back to regex entity extraction.")
        nlp = None
else:
    nlp = None


class CharacterGraph:
    """
    Builds and maintains a knowledge graph of characters in a story.
    """

    def __init__(self):
        self.graph = nx.DiGraph()
        self.appearances = defaultdict(list)
        self.events = defaultdict(list)

    def process_text(self, paragraphs):
        all_issues = []

        for para_idx, paragraph in enumerate(paragraphs):
            characters, locations = self._extract_entities(paragraph)

            for char in set(characters):
                if char not in self.graph:
                    self.graph.add_node(char, first_seen=para_idx)

                self.appearances[char].append(para_idx)

                death_keywords = ["died", "dead", "killed", "deceased", "passed away", "murdered"]
                is_death_event = any(kw in paragraph.lower() for kw in death_keywords)
                emotion = self._detect_emotion(paragraph)

                self.events[char].append(
                    {
                        "paragraph": para_idx,
                        "text": paragraph[:100] + "...",
                        "location": locations[0] if locations else None,
                        "death_flag": is_death_event,
                        "emotion": emotion,
                    }
                )

        for char in self.graph.nodes:
            issues = self._check_contradictions(char)
            all_issues.extend(issues)

        return {
            "characters": dict(self.appearances),
            "issues": all_issues,
            "graph": self.graph,
        }

    def _extract_entities(self, paragraph):
        """
        Extract characters and location cues from a paragraph.
        """
        if nlp is not None:
            doc = nlp(paragraph)
            characters = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
            locations = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
            return characters, locations

        tokens = re.findall(r"\b[A-Z][a-z]{2,}\b", paragraph)
        starter_words = {
            "The",
            "This",
            "That",
            "These",
            "Those",
            "When",
            "While",
            "After",
            "Before",
            "Then",
            "But",
            "And",
            "Because",
            "If",
            "In",
            "On",
            "At",
            "From",
            "To",
            "By",
            "With",
            "Without",
            "For",
            "As",
            "It",
            "He",
            "She",
            "They",
            "We",
            "I",
            "You",
            "His",
            "Her",
            "Their",
            "Our",
        }
        characters = [token for token in tokens if token not in starter_words]

        locations = []
        for match in re.finditer(
            r"\b(?:in|at|from|to|near|inside|outside)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
            paragraph,
        ):
            locations.append(match.group(1))

        return characters, locations

    def _check_contradictions(self, character):
        events = self.events[character]
        issues = []
        death_paragraph = None

        for event in events:
            if event["death_flag"] and death_paragraph is None:
                death_paragraph = event["paragraph"]
            elif death_paragraph is not None and event["paragraph"] > death_paragraph:
                issues.append(
                    {
                        "type": "zombie_character",
                        "character": character,
                        "message": (
                            f"'{character}' appears in paragraph {event['paragraph'] + 1} "
                            f"but was referenced as dead in paragraph {death_paragraph + 1}"
                        ),
                        "severity": "high",
                        "paragraph": event["paragraph"],
                    }
                )

        location_map = defaultdict(list)
        for event in events:
            if event["location"]:
                location_map[event["paragraph"]].append(event["location"])

        for para, locs in location_map.items():
            if len(set(locs)) > 1:
                issues.append(
                    {
                        "type": "location_conflict",
                        "character": character,
                        "message": f"'{character}' appears in multiple locations in paragraph {para + 1}: {locs}",
                        "severity": "medium",
                        "paragraph": para,
                    }
                )

        return issues

    def _detect_emotion(self, text):
        emotions = {
            "angry": ["angry", "furious", "rage", "shouted", "yelled"],
            "sad": ["sad", "cried", "tears", "grief", "mourned"],
            "happy": ["smiled", "laughed", "joy", "happy", "excited"],
            "afraid": ["afraid", "scared", "terrified", "trembled", "fear"],
        }
        text_lower = text.lower()
        for emotion, keywords in emotions.items():
            if any(kw in text_lower for kw in keywords):
                return emotion
        return "neutral"

    def get_character_summary(self):
        summary = {}
        for char in self.graph.nodes:
            events = self.events[char]
            locations = [e["location"] for e in events if e["location"]]
            emotions = [e["emotion"] for e in events if e["emotion"] != "neutral"]
            summary[char] = {
                "appears_in_paragraphs": self.appearances[char],
                "locations_mentioned": list(set(locations)),
                "emotional_states": list(set(emotions)),
                "total_appearances": len(self.appearances[char]),
            }
        return summary
