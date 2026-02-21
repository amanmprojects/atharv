from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from enum import Enum


class EntityType(str, Enum):
    PERSON = "person"
    LOCATION = "location"
    ORGANIZATION = "organization"
    DATE = "date"
    MISC = "misc"


class Entity(BaseModel):
    id: str
    name: str
    entity_type: EntityType
    mentions: List[Dict[str, Any]]
    attributes: Dict[str, Any] = {}
    aliases: List[str] = []


class Relationship(BaseModel):
    source_id: str
    target_id: str
    relation_type: str
    context: str


class EntityGraph(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]


class ConsistencyWarning(BaseModel):
    entity_id: str
    entity_name: str
    warning_type: str
    description: str
    locations: List[Dict[str, Any]]
    severity: str = "medium"


class EnhancementSuggestion(BaseModel):
    id: str
    suggestion_type: str
    original_text: str
    suggested_text: Optional[str] = None
    explanation: str
    location: Dict[str, int]
    severity: str = "medium"


class StyleProfile(str, Enum):
    FORMAL = "formal"
    CASUAL = "casual"
    NEUTRAL = "neutral"


class StyleTransformRequest(BaseModel):
    text: str
    target_style: StyleProfile
    intensity: float = 0.5


class StyleTransformResponse(BaseModel):
    original: str
    transformed: str
    changes: List[Dict[str, Any]]
    explanation: str


class AnalyzeRequest(BaseModel):
    text: str
    track_entities: bool = True
    check_consistency: bool = True
    analyze_clarity: bool = True


class AnalyzeResponse(BaseModel):
    entity_graph: Optional[EntityGraph] = None
    consistency_warnings: List[ConsistencyWarning] = []
    enhancement_suggestions: List[EnhancementSuggestion] = []
    readability_scores: Dict[str, float] = {}
    statistics: Dict[str, Any] = {}
