from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class SeverityLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IssueType(str, Enum):
    CONTRADICTION = "contradiction"
    PERSONALITY_DRIFT = "personality_drift"
    TIMELINE_ERROR = "timeline_error"
    TRANSITION_GAP = "transition_gap"
    WEAK_INTRO = "weak_intro"
    REDUNDANCY = "redundancy"
    LOGICAL_JUMP = "logical_jump"
    COMPLEX_SENTENCE = "complex_sentence"
    FLAT_EMOTION = "flat_emotion"
    VAGUE_REFERENCE = "vague_reference"


class SourceType(str, Enum):
    CUSTOM_PIPELINE = "custom_pipeline"
    LLM_REWRITE = "llm_rewrite"


class SuggestionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class CharacterInfo(BaseModel):
    name: str
    aliases: List[str] = []
    traits: List[str] = []
    role: Optional[str] = None
    first_mention_paragraph: int
    mention_count: int


class ContradictionIssue(BaseModel):
    entity: str
    issue_type: str = "contradiction"
    section_a: dict
    section_b: dict
    severity: SeverityLevel
    confidence: float
    explanation: str


class StructuralIssue(BaseModel):
    issue_type: IssueType
    location: dict
    severity: SeverityLevel
    score: float
    explanation: str
    suggestion: Optional[str] = None


class Suggestion(BaseModel):
    suggestion_id: str
    original_text: str
    modified_text: str
    rule_triggered: str
    reason: str
    confidence: float
    improvement_score: float
    source: SourceType
    severity: SeverityLevel = SeverityLevel.MEDIUM
    status: SuggestionStatus = SuggestionStatus.PENDING
    location: Optional[dict] = None


class EmotionData(BaseModel):
    paragraph: int
    emotions: dict[str, float]


class EmotionalArc(BaseModel):
    arc_shape: str
    flat_zones: List[dict]
    pacing_scores: List[float]
    emotion_timeline: List[EmotionData]


class StyleFingerprint(BaseModel):
    sentence_length_mean: float
    sentence_length_std: float
    passive_voice_ratio: float
    vocabulary_complexity: float
    dialogue_percentage: float
    narrative_density: float
    adverb_usage_rate: float
    rhetorical_question_frequency: float
    paragraph_length_variance: float


class ReadabilityScores(BaseModel):
    flesch_kincaid: float
    gunning_fog: float
    coleman_liau: float
    smog: float
    dale_chall: float


# --- Knowledge Graph Schemas ---
class KnowledgeGraphEntity(BaseModel):
    name: str
    entity_type: str
    frequency: int
    first_paragraph: int
    mentions: List[dict] = []
    attributes: dict = {}


class KnowledgeGraphRelationship(BaseModel):
    source: str
    target: str
    relationship_type: str
    weight: float = 1.0
    paragraphs: List[int] = []
    evidence: List[str] = []


class KnowledgeGraphEvent(BaseModel):
    description: str
    paragraph: int
    entities_involved: List[str] = []
    temporal_marker: Optional[str] = None
    event_type: str = "general"


class KnowledgeGraphResponse(BaseModel):
    entities: List[KnowledgeGraphEntity] = []
    relationships: List[KnowledgeGraphRelationship] = []
    events: List[KnowledgeGraphEvent] = []
    entity_frequency_map: Dict[str, List[int]] = {}
    orphaned_entities: List[str] = []
    central_entities: List[str] = []
    graph_stats: Dict[str, Any] = {}


# --- SEO Schemas ---
class SEOAnalysisRequest(BaseModel):
    text: str
    target_keywords: List[str] = []


class SEOAnalysisResponse(BaseModel):
    overall_score: float
    keyword_analysis: dict
    heading_analysis: dict
    content_analysis: dict
    issues: List[dict]
    recommendations: List[str]
    meta_suggestions: dict


# --- Comparative Analysis Schemas ---
class CompareRequest(BaseModel):
    text_a: str
    text_b: str


class CompareResponse(BaseModel):
    structural_diff: dict
    word_stats: dict
    readability_delta: dict
    style_delta: dict
    vocabulary_comparison: dict
    sentence_diff: dict
    improvement_score: dict
    summary: str


# --- Accessibility Schemas ---
class AccessibilityRequest(BaseModel):
    text: str


class AccessibilityResponse(BaseModel):
    simplification: dict
    idea_clusters: dict
    naturalness: dict
    readability_assessment: dict
    dyslexia_suggestions: dict
    structure_suggestions: dict
    overall_accessibility_score: dict


# --- Watermarking Schemas ---
class WatermarkEmbedRequest(BaseModel):
    text: str
    watermark_id: Optional[str] = None


class WatermarkEmbedResponse(BaseModel):
    watermarked_text: str
    watermark_id: str
    bits_encoded: int
    bits_total: int
    modifications_made: int
    original_length: int
    watermarked_length: int
    encoding_success_rate: float


class WatermarkDetectRequest(BaseModel):
    text: str
    original_text: Optional[str] = None


class WatermarkDetectResponse(BaseModel):
    watermark_detected: bool
    decoded_id: Optional[str] = None
    bits_detected: int
    confidence: float
    evidence: List[str] = []
    bit_pattern: str = ""


class WatermarkVerifyRequest(BaseModel):
    text: str
    claimed_watermark_id: str


class WatermarkVerifyResponse(BaseModel):
    verified: bool
    match_score: float
    claimed_id: str
    detected_id: Optional[str] = None
    evidence_count: int
    confidence: float


class StylometricSignatureResponse(BaseModel):
    signature_hash: str
    avg_word_length: float
    avg_sentence_length: float
    vocabulary_richness: float
    letter_frequencies: dict
    punctuation_patterns: dict
    function_word_usage: dict
    hapax_legomena_ratio: float


# --- Admin Dashboard Schemas ---
class AdminAnalyticsEvent(BaseModel):
    event_type: str  # 'analysis', 'transform', 'suggestion_accept', 'suggestion_reject'
    timestamp: str
    details: dict = {}


class AdminStatsResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    total_analyses: int
    total_documents: int
    total_suggestions: int
    acceptance_rate: float
    avg_processing_time_ms: float
    llm_calls_total: int
    rule_trigger_frequency: Dict[str, int]
    suggestion_stats: dict
    model_performance: dict


# --- Original Analysis Schemas (Enhanced) ---
class AnalysisRequest(BaseModel):
    text: str
    genre: str = "fiction"
    mode: str = "full"
    enable_narrative: bool = True
    enable_structural: bool = True
    enable_emotional: bool = True
    enable_style: bool = True
    enable_seo: bool = False
    enable_accessibility: bool = False
    enable_knowledge_graph: bool = False


class AnalysisResponse(BaseModel):
    document_id: str
    word_count: int
    sentence_count: int
    paragraph_count: int
    language: str
    characters: List[CharacterInfo] = []
    contradictions: List[ContradictionIssue] = []
    structural_issues: List[StructuralIssue] = []
    suggestions: List[Suggestion] = []
    emotional_arc: Optional[EmotionalArc] = None
    style_fingerprint: Optional[StyleFingerprint] = None
    readability_scores: Optional[ReadabilityScores] = None
    knowledge_graph: Optional[KnowledgeGraphResponse] = None
    seo_analysis: Optional[SEOAnalysisResponse] = None
    accessibility: Optional[AccessibilityResponse] = None
    llm_calls_used: int = 0
    processing_time_ms: float


class StyleTransformRequest(BaseModel):
    text: str
    style_mode: str
    intensity: float = Field(0.5, ge=0.0, le=1.0)
    preserve_entities: bool = True


class StyleTransformResponse(BaseModel):
    original_text: str
    transformed_text: str
    style_mode: str
    intensity: float
    meaning_preservation_score: float
    llm_call_used: bool


class DocumentCreate(BaseModel):
    title: str
    content: str
    genre: str = "fiction"


class Document(BaseModel):
    id: str
    title: str
    content: str
    genre: str
    word_count: int
    created_at: datetime
    updated_at: datetime
    analysis: Optional[AnalysisResponse] = None
