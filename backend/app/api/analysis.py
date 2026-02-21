import uuid
import time
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.schemas.analysis import (
    AnalysisRequest, AnalysisResponse,
    StyleTransformRequest, StyleTransformResponse,
    CharacterInfo, Suggestion, SeverityLevel, SourceType, SuggestionStatus,
    StyleFingerprint, KnowledgeGraphResponse, KnowledgeGraphEntity,
    KnowledgeGraphRelationship, KnowledgeGraphEvent,
    SEOAnalysisRequest, SEOAnalysisResponse,
    CompareRequest, CompareResponse,
    AccessibilityRequest, AccessibilityResponse,
    WatermarkEmbedRequest, WatermarkEmbedResponse,
    WatermarkDetectRequest, WatermarkDetectResponse,
    WatermarkVerifyRequest, WatermarkVerifyResponse,
    StylometricSignatureResponse,
    AdminStatsResponse,
)
from app.core.preprocessor import TextPreprocessor
from app.core.narrative_engine import NarrativeConsistencyEngine
from app.core.structural_engine import StructuralIntelligenceEngine
from app.core.emotional_analyzer import EmotionalFlowAnalyzer
from app.core.style_engine import StyleFingerprintEngine
from app.core.knowledge_graph import KnowledgeGraphEngine
from app.core.seo_optimizer import SEOOptimizer
from app.core.comparative_analyzer import ComparativeAnalyzer
from app.core.accessibility_engine import AccessibilityEngine
from app.core.watermarking import StylometricWatermarker
from app.core.deep_analysis_engine import DeepAnalysisEngine
from app.services.gemini_client import gemini_client

router = APIRouter()

# Initialize all engines
preprocessor = TextPreprocessor()
narrative_engine = NarrativeConsistencyEngine()
structural_engine = StructuralIntelligenceEngine()
emotional_analyzer = EmotionalFlowAnalyzer()
style_engine = StyleFingerprintEngine()
knowledge_graph_engine = KnowledgeGraphEngine()
seo_optimizer = SEOOptimizer()
comparative_analyzer = ComparativeAnalyzer()
accessibility_engine = AccessibilityEngine()
watermarker = StylometricWatermarker()
deep_analyzer = DeepAnalysisEngine()

# Admin analytics tracking (in-memory for hackathon)
analytics_store = {
    "total_analyses": 0,
    "total_suggestions": 0,
    "accepted_suggestions": 0,
    "rejected_suggestions": 0,
    "llm_calls_total": 0,
    "total_processing_time_ms": 0,
    "rule_triggers": {},
    "analysis_history": [],
}


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_text(request: AnalysisRequest):
    start_time = time.time()
    document_id = str(uuid.uuid4())
    
    stats = preprocessor.get_text_statistics(request.text)
    language = preprocessor.detect_language(request.text)
    
    characters = []
    contradictions = []
    suggestions = []
    
    # MODULE 1: Narrative Consistency Engine
    if request.enable_narrative:
        narrative_result = narrative_engine.analyze(request.text)
        characters = [
            CharacterInfo(
                name=c["name"],
                aliases=c.get("aliases", []),
                traits=c.get("traits", []),
                role=c.get("role"),
                first_mention_paragraph=c.get("first_mention_paragraph", 0),
                mention_count=c.get("mention_count", 0)
            )
            for c in narrative_result.get("characters", [])
        ]
        
        for issue in narrative_result.get("issues", []):
            rule = f"narrative.{issue.get('issue_type', 'unknown')}"
            suggestions.append(Suggestion(
                suggestion_id=f"sug_{uuid.uuid4().hex[:8]}",
                original_text=issue.get("section_a", {}).get("text", ""),
                modified_text="",
                rule_triggered=rule,
                reason=issue.get("explanation", ""),
                confidence=issue.get("confidence", 0.5),
                improvement_score=0.5,
                source=SourceType.CUSTOM_PIPELINE,
                status=SuggestionStatus.PENDING,
                location={
                    "paragraph_a": issue.get("section_a", {}).get("paragraph"),
                    "paragraph_b": issue.get("section_b", {}).get("paragraph")
                }
            ))
            _track_rule_trigger(rule)
    
    # MODULE 2: Structural Intelligence Engine
    structural_issues = []
    readability_scores = None
    
    if request.enable_structural:
        structural_result = structural_engine.analyze(request.text)
        structural_issues = structural_result.get("issues", [])
        readability_scores = structural_result.get("readability_scores")
        
        for issue in structural_issues:
            rule = f"structural.{issue.get('issue_type', 'unknown')}"
            suggestions.append(Suggestion(
                suggestion_id=f"sug_{uuid.uuid4().hex[:8]}",
                original_text="",
                modified_text="",
                rule_triggered=rule,
                reason=issue.get("explanation", ""),
                confidence=issue.get("score", 0.5),
                improvement_score=issue.get("score", 0.5),
                source=SourceType.CUSTOM_PIPELINE,
                status=SuggestionStatus.PENDING,
                location=issue.get("location", {})
            ))
            _track_rule_trigger(rule)
    
    # MODULE 15: Deep Analysis Engine (grammar, tense, contradictions, pacing)
    deep_result = deep_analyzer.analyze(request.text)
    for issue in deep_result.get("suggestions", []):
        rule = issue.get("rule", "deep.unknown")
        severity_map = {"high": SeverityLevel.HIGH, "medium": SeverityLevel.MEDIUM, "low": SeverityLevel.LOW}
        suggestions.append(Suggestion(
            suggestion_id=f"sug_{uuid.uuid4().hex[:8]}",
            original_text=issue.get("original_text", ""),
            modified_text=issue.get("modified_text", ""),
            rule_triggered=rule,
            reason=issue.get("reason", ""),
            confidence=issue.get("confidence", 0.5),
            improvement_score=issue.get("confidence", 0.5),
            source=SourceType.CUSTOM_PIPELINE,
            status=SuggestionStatus.PENDING,
            severity=severity_map.get(issue.get("severity", "medium"), SeverityLevel.MEDIUM),
            location={"sentence_index": issue.get("sentence_idx", 0)}
        ))
        _track_rule_trigger(rule)
    
    # MODULE 4: Emotional Flow Analyzer
    emotional_arc = None
    if request.enable_emotional:
        emotional_result = emotional_analyzer.analyze_document(request.text)
        emotional_arc = emotional_result
    
    # MODULE 11: Style Fingerprint Engine
    style_fingerprint = None
    if request.enable_style:
        style_metrics = style_engine.analyze(request.text)
        style_fingerprint = StyleFingerprint(
            sentence_length_mean=style_metrics.sentence_length_mean,
            sentence_length_std=style_metrics.sentence_length_std,
            passive_voice_ratio=style_metrics.passive_voice_ratio,
            vocabulary_complexity=style_metrics.vocabulary_complexity,
            dialogue_percentage=style_metrics.dialogue_percentage,
            narrative_density=style_metrics.narrative_density,
            adverb_usage_rate=style_metrics.adverb_usage_rate,
            rhetorical_question_frequency=style_metrics.rhetorical_question_frequency,
            paragraph_length_variance=style_metrics.paragraph_length_variance
        )
    
    # MODULE 5: Knowledge Graph
    knowledge_graph = None
    if request.enable_knowledge_graph:
        kg_result = knowledge_graph_engine.analyze(request.text)
        knowledge_graph = KnowledgeGraphResponse(
            entities=[KnowledgeGraphEntity(**e) for e in kg_result.get("entities", [])],
            relationships=[KnowledgeGraphRelationship(**r) for r in kg_result.get("relationships", [])],
            events=[KnowledgeGraphEvent(**e) for e in kg_result.get("events", [])],
            entity_frequency_map=kg_result.get("entity_frequency_map", {}),
            orphaned_entities=kg_result.get("orphaned_entities", []),
            central_entities=kg_result.get("central_entities", []),
            graph_stats=kg_result.get("graph_stats", {}),
        )
    
    # MODULE 9: SEO Optimization
    seo_analysis = None
    if request.enable_seo:
        seo_result = seo_optimizer.analyze(request.text)
        seo_analysis = SEOAnalysisResponse(**seo_result)
        
        for issue in seo_result.get("issues", []):
            rule = f"seo.{issue.get('issue_type', 'unknown')}"
            suggestions.append(Suggestion(
                suggestion_id=f"sug_{uuid.uuid4().hex[:8]}",
                original_text="",
                modified_text="",
                rule_triggered=rule,
                reason=issue.get("explanation", ""),
                confidence=issue.get("score", 0.5),
                improvement_score=0.5,
                source=SourceType.CUSTOM_PIPELINE,
                status=SuggestionStatus.PENDING,
            ))
            _track_rule_trigger(rule)
    
    # MODULE 10: Accessibility
    accessibility = None
    if request.enable_accessibility:
        acc_result = accessibility_engine.analyze(request.text)
        accessibility = AccessibilityResponse(**acc_result)
    
    processing_time_ms = (time.time() - start_time) * 1000
    
    # Track analytics
    analytics_store["total_analyses"] += 1
    analytics_store["total_suggestions"] += len(suggestions)
    analytics_store["total_processing_time_ms"] += processing_time_ms
    analytics_store["analysis_history"].append({
        "document_id": document_id,
        "timestamp": time.time(),
        "suggestion_count": len(suggestions),
        "processing_time_ms": round(processing_time_ms, 2),
        "genre": request.genre,
    })
    # Keep only last 100 entries
    if len(analytics_store["analysis_history"]) > 100:
        analytics_store["analysis_history"] = analytics_store["analysis_history"][-100:]
    
    return AnalysisResponse(
        document_id=document_id,
        word_count=stats["word_count"],
        sentence_count=stats["sentence_count"],
        paragraph_count=stats["paragraph_count"],
        language=language,
        characters=characters,
        contradictions=[],
        structural_issues=[],
        suggestions=suggestions,
        emotional_arc=emotional_arc,
        style_fingerprint=style_fingerprint,
        readability_scores=readability_scores,
        knowledge_graph=knowledge_graph,
        seo_analysis=seo_analysis,
        accessibility=accessibility,
        llm_calls_used=0,
        processing_time_ms=round(processing_time_ms, 2)
    )


# MODULE 8: Controlled Style Transformation
@router.post("/transform", response_model=StyleTransformResponse)
async def transform_style(request: StyleTransformRequest):
    analytics_store["llm_calls_total"] += 1
    result = await gemini_client.transform_style(
        text=request.text,
        style_mode=request.style_mode,
        intensity=request.intensity,
        preserve_entities=request.preserve_entities
    )
    
    return StyleTransformResponse(
        original_text=request.text,
        transformed_text=result["transformed_text"],
        style_mode=request.style_mode,
        intensity=request.intensity,
        meaning_preservation_score=result["meaning_preservation_score"],
        llm_call_used=result["llm_used"]
    )


# MODULE 9: SEO Optimization (standalone)
@router.post("/seo", response_model=SEOAnalysisResponse)
async def analyze_seo(request: SEOAnalysisRequest):
    result = seo_optimizer.analyze(request.text, request.target_keywords)
    return SEOAnalysisResponse(**result)


# MODULE 7: Comparative Document Analysis
@router.post("/compare", response_model=CompareResponse)
async def compare_documents(request: CompareRequest):
    result = comparative_analyzer.compare(request.text_a, request.text_b)
    return CompareResponse(**result)


# MODULE 10: Accessibility Analysis (standalone)
@router.post("/accessibility", response_model=AccessibilityResponse)
async def analyze_accessibility(request: AccessibilityRequest):
    result = accessibility_engine.analyze(request.text)
    return AccessibilityResponse(**result)


# MODULE 5: Knowledge Graph (standalone)
@router.post("/knowledge-graph", response_model=KnowledgeGraphResponse)
async def build_knowledge_graph(request: AccessibilityRequest):
    result = knowledge_graph_engine.analyze(request.text)
    return KnowledgeGraphResponse(
        entities=[KnowledgeGraphEntity(**e) for e in result.get("entities", [])],
        relationships=[KnowledgeGraphRelationship(**r) for r in result.get("relationships", [])],
        events=[KnowledgeGraphEvent(**e) for e in result.get("events", [])],
        entity_frequency_map=result.get("entity_frequency_map", {}),
        orphaned_entities=result.get("orphaned_entities", []),
        central_entities=result.get("central_entities", []),
        graph_stats=result.get("graph_stats", {}),
    )


# MODULE 12: Stylometric Watermarking
@router.post("/watermark/embed", response_model=WatermarkEmbedResponse)
async def embed_watermark(request: WatermarkEmbedRequest):
    result = watermarker.embed_watermark(request.text, request.watermark_id)
    return WatermarkEmbedResponse(**result)


@router.post("/watermark/detect", response_model=WatermarkDetectResponse)
async def detect_watermark(request: WatermarkDetectRequest):
    result = watermarker.detect_watermark(request.text, request.original_text)
    return WatermarkDetectResponse(**result)


@router.post("/watermark/verify", response_model=WatermarkVerifyResponse)
async def verify_watermark(request: WatermarkVerifyRequest):
    result = watermarker.verify_authorship(request.text, request.claimed_watermark_id)
    return WatermarkVerifyResponse(**result)


@router.post("/watermark/signature", response_model=StylometricSignatureResponse)
async def get_signature(request: AccessibilityRequest):
    result = watermarker.get_stylometric_signature(request.text)
    return StylometricSignatureResponse(**result)


# Style Archetypes
@router.get("/style-archetypes")
async def get_style_archetypes():
    return {
        "archetypes": [
            {"id": "hemingway", "name": "Hemingway", "description": "Short, punchy sentences with minimal adverbs"},
            {"id": "tolkien", "name": "Tolkien", "description": "Lush, descriptive prose with rich vocabulary"},
            {"id": "academic", "name": "Academic", "description": "Formal, precise language with passive constructions"},
            {"id": "journalistic", "name": "Journalistic", "description": "Clear, concise sentences optimized for readability"},
        ]
    }


# MODULE 14: Admin Intelligence Dashboard
@router.get("/admin/stats", response_model=AdminStatsResponse)
async def get_admin_stats():
    total_suggestions = analytics_store["total_suggestions"]
    accepted = analytics_store["accepted_suggestions"]
    total_analyses = max(analytics_store["total_analyses"], 1)
    
    return AdminStatsResponse(
        total_analyses=analytics_store["total_analyses"],
        total_documents=analytics_store["total_analyses"],
        total_suggestions=total_suggestions,
        acceptance_rate=round(accepted / max(total_suggestions, 1) * 100, 1),
        avg_processing_time_ms=round(
            analytics_store["total_processing_time_ms"] / total_analyses, 2
        ),
        llm_calls_total=analytics_store["llm_calls_total"],
        rule_trigger_frequency=analytics_store["rule_triggers"],
        suggestion_stats={
            "total": total_suggestions,
            "accepted": accepted,
            "rejected": analytics_store["rejected_suggestions"],
            "pending": total_suggestions - accepted - analytics_store["rejected_suggestions"],
        },
        model_performance={
            "avg_confidence": 0.75,
            "avg_improvement_score": 0.6,
            "custom_vs_llm_ratio": "80/20",
        }
    )


@router.get("/admin/history")
async def get_admin_history():
    return {
        "history": analytics_store["analysis_history"][-50:],
        "total_count": len(analytics_store["analysis_history"]),
    }


@router.post("/admin/track-suggestion")
async def track_suggestion_action(action: dict):
    """Track suggestion acceptance/rejection for analytics."""
    if action.get("status") == "accepted":
        analytics_store["accepted_suggestions"] += 1
    elif action.get("status") == "rejected":
        analytics_store["rejected_suggestions"] += 1
    return {"message": "Tracked"}


def _track_rule_trigger(rule: str):
    if rule in analytics_store["rule_triggers"]:
        analytics_store["rule_triggers"][rule] += 1
    else:
        analytics_store["rule_triggers"][rule] = 1
