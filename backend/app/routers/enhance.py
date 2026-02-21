from fastapi import APIRouter, HTTPException
from app.models.schemas import EnhancementSuggestion
from app.core.clarity_analyzer import ClarityAnalyzer
from app.core.style_engine import StyleEngine, StyleType
from typing import List
import uuid

router = APIRouter(prefix="/enhance", tags=["enhancement"])

clarity_analyzer = ClarityAnalyzer()
style_engine = StyleEngine()


@router.post("/suggestions")
async def get_enhancement_suggestions(text: str) -> List[EnhancementSuggestion]:
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    analysis = clarity_analyzer.analyze(text)
    suggestions = []
    
    for issue in analysis.get("clarity_issues", []):
        suggestion_type = issue["type"]
        original = issue.get("sentence", issue.get("word", issue.get("phrase", "")))
        explanation = issue.get("suggestion", f"Issue detected: {suggestion_type}")
        
        severity = "low"
        if suggestion_type in ["passive_voice", "long_sentence"]:
            severity = "medium"
        elif suggestion_type in ["vague_word", "cliche", "repetition"]:
            severity = "low"
        
        suggestion = EnhancementSuggestion(
            id=f"enh_{uuid.uuid4().hex[:8]}",
            suggestion_type=suggestion_type,
            original_text=original,
            suggested_text=None,
            explanation=explanation,
            location={"sentence_index": issue.get("sentence_index", 0)},
            severity=severity
        )
        suggestions.append(suggestion)
    
    return suggestions


@router.post("/flow-analysis")
async def analyze_flow(text: str):
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    analysis = clarity_analyzer.analyze(text)
    return analysis["flow_analysis"]


@router.post("/readability")
async def get_readability(text: str):
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    analysis = clarity_analyzer.analyze(text)
    return analysis["readability_scores"]


@router.post("/style-score")
async def get_style_score(text: str):
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    analysis = style_engine.get_style_analysis(text)
    return analysis
