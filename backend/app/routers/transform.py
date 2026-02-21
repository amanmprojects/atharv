from fastapi import APIRouter, HTTPException
from app.models.schemas import StyleTransformRequest, StyleTransformResponse, StyleProfile
from app.core.style_engine import StyleEngine, StyleType
from typing import List, Dict, Any

router = APIRouter(prefix="/transform", tags=["transformation"])

style_engine = StyleEngine()


@router.post("/style", response_model=StyleTransformResponse)
async def transform_style(request: StyleTransformRequest):
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    target_style = StyleType.FORMAL if request.target_style == StyleProfile.FORMAL else StyleType.CASUAL
    
    transformed, changes = style_engine.transform(
        request.text,
        target_style,
        request.intensity
    )
    
    change_list = []
    for change in changes:
        change_list.append({
            "original": change.original,
            "replacement": change.replacement,
            "change_type": change.change_type,
            "explanation": change.explanation
        })
    
    style_analysis = style_engine.get_style_analysis(transformed)
    
    explanation = f"Transformed text to {request.target_style.value} style with {len(changes)} changes. "
    explanation += f"New formality score: {style_analysis['formality_score']}/100"
    
    return StyleTransformResponse(
        original=request.text,
        transformed=transformed,
        changes=change_list,
        explanation=explanation
    )


@router.post("/preview")
async def preview_transformation(text: str, target_style: StyleProfile, intensity: float = 0.5):
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    target = StyleType.FORMAL if target_style == StyleProfile.FORMAL else StyleType.CASUAL
    
    transformed, changes = style_engine.transform(text, target, intensity)
    
    return {
        "original": text,
        "transformed": transformed,
        "change_count": len(changes),
        "changes_preview": [
            {"original": c.original, "replacement": c.replacement}
            for c in changes[:5]
        ]
    }


@router.get("/diff")
async def get_diff(original: str, transformed: str) -> List[Dict[str, Any]]:
    if not original or not transformed:
        raise HTTPException(status_code=400, detail="Both original and transformed text are required")
    
    import difflib
    
    original_words = original.split()
    transformed_words = transformed.split()
    
    diff = difflib.unified_diff(
        original_words,
        transformed_words,
        lineterm=""
    )
    
    changes = []
    matcher = difflib.SequenceMatcher(None, original_words, transformed_words)
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag != "equal":
            changes.append({
                "type": tag,
                "original_segment": " ".join(original_words[i1:i2]),
                "transformed_segment": " ".join(transformed_words[j1:j2]),
                "original_indices": [i1, i2],
                "transformed_indices": [j1, j2]
            })
    
    return changes
