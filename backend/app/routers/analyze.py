from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyzeRequest, AnalyzeResponse, EntityGraph, Entity, ConsistencyWarning, EnhancementSuggestion
from app.core.entity_tracker import EntityTracker
from app.core.consistency_checker import ConsistencyChecker
from app.core.clarity_analyzer import ClarityAnalyzer
import uuid

router = APIRouter(prefix="/analyze", tags=["analysis"])

entity_tracker = EntityTracker()
consistency_checker = ConsistencyChecker()
clarity_analyzer = ClarityAnalyzer()


@router.post("", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    text = request.text
    
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    entity_graph = None
    consistency_warnings = []
    enhancement_suggestions = []
    readability_scores = {}
    statistics = {}
    
    if request.track_entities:
        graph_data = entity_tracker.build_entity_graph(text)
        entity_graph = EntityGraph(
            entities=[Entity(**e) for e in graph_data["entities"]],
            relationships=graph_data["relationships"]
        )
    
    if request.check_consistency and entity_graph:
        warnings = consistency_checker.check_consistency(
            text, 
            [e.model_dump() for e in entity_graph.entities]
        )
        consistency_warnings = [ConsistencyWarning(**w) for w in warnings]
    
    if request.analyze_clarity:
        analysis = clarity_analyzer.analyze(text)
        readability_scores = analysis["readability_scores"]
        statistics = analysis["statistics"]
        
        for issue in analysis.get("clarity_issues", []):
            suggestion = EnhancementSuggestion(
                id=f"enh_{uuid.uuid4().hex[:8]}",
                suggestion_type=issue["type"],
                original_text=issue.get("sentence", issue.get("word", "")),
                suggested_text=None,
                explanation=issue.get("suggestion", ""),
                location={"sentence_index": issue.get("sentence_index", 0)},
                severity="medium" if issue["type"] in ["vague_word", "cliche"] else "low"
            )
            enhancement_suggestions.append(suggestion)
    
    return AnalyzeResponse(
        entity_graph=entity_graph,
        consistency_warnings=consistency_warnings,
        enhancement_suggestions=enhancement_suggestions,
        readability_scores=readability_scores,
        statistics=statistics
    )


@router.get("/entities")
async def get_entities(text: str):
    if not text:
        raise HTTPException(status_code=400, detail="Text parameter is required")
    
    entities = entity_tracker.extract_entities(text)
    return {"entities": entities}


@router.get("/style-analysis")
async def analyze_style(text: str):
    if not text:
        raise HTTPException(status_code=400, detail="Text parameter is required")
    
    from app.core.style_engine import StyleEngine
    style_engine = StyleEngine()
    analysis = style_engine.get_style_analysis(text)
    return analysis
