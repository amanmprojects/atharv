from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header
from app.services.ai_service import ai_service
from app.schemas.firebase import AIRequestCreate, AIRequestResponse, AIFeature


router = APIRouter()


def get_user_id(authorization: Optional[str] = None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    return (
        authorization.replace("Bearer ", "")
        if authorization.startswith("Bearer ")
        else authorization
    )


@router.post("/{feature}", response_model=AIRequestResponse)
async def create_ai_request(
    feature: AIFeature,
    request: AIRequestCreate,
    authorization: Optional[str] = Header(None),
):
    user_id = get_user_id(authorization)

    if user_id != request.user_id:
        raise HTTPException(
            status_code=403, detail="Cannot create request for another user"
        )

    if feature != request.feature:
        raise HTTPException(status_code=400, detail="Feature mismatch")

    ai_request = await ai_service.create_request(
        request.user_id,
        request.document_id,
        request.feature.value,
        request.input,
        request.ai_consent,
    )

    if not ai_request:
        raise HTTPException(
            status_code=400, detail="Invalid AI feature or consent required"
        )

    return ai_request


@router.get("/{feature}/{request_id}", response_model=AIRequestResponse)
async def get_ai_request(
    feature: AIFeature, request_id: str, authorization: Optional[str] = Header(None)
):
    user_id = get_user_id(authorization)

    ai_request = await ai_service.get_request(request_id)

    if not ai_request:
        raise HTTPException(status_code=404, detail="Request not found")

    if ai_request.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return ai_request


@router.get("/{feature}", response_model=List[AIRequestResponse])
async def list_ai_requests(
    feature: AIFeature, limit: int = 10, authorization: Optional[str] = Header(None)
):
    user_id = get_user_id(authorization)

    requests = await ai_service.get_user_requests(user_id, limit)

    filtered = [r for r in requests if r.get("feature") == feature.value]

    return filtered
