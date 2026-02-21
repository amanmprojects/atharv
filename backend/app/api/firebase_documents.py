from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header
from app.services.document_service import document_service
from app.schemas.firebase import (
    FirebaseDocument,
    FirebaseDocumentCreate,
    FirebaseDocumentUpdate,
    FirebaseDocumentContent,
    ShareInvitationCreate,
    ShareInvitation,
)


router = APIRouter()


def get_user_id(authorization: Optional[str] = None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    return (
        authorization.replace("Bearer ", "")
        if authorization.startswith("Bearer ")
        else authorization
    )


@router.get("/", response_model=List[FirebaseDocument])
async def list_documents(
    include_deleted: bool = False, authorization: Optional[str] = Header(None)
):
    user_id = get_user_id(authorization)
    documents = await document_service.list_documents(user_id, include_deleted)
    return documents


@router.post("/", response_model=FirebaseDocument)
async def create_document(
    doc: FirebaseDocumentCreate, authorization: Optional[str] = Header(None)
):
    user_id = get_user_id(authorization)
    if user_id != doc.owner_id:
        raise HTTPException(
            status_code=403, detail="Cannot create document for another user"
        )

    document = await document_service.create_document(doc.title, doc.owner_id)
    return document


@router.get("/{doc_id}", response_model=FirebaseDocument)
async def get_document(doc_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    document = await document_service.get_document(doc_id, user_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


@router.put("/{doc_id}", response_model=FirebaseDocument)
async def update_document(
    doc_id: str,
    updates: FirebaseDocumentUpdate,
    authorization: Optional[str] = Header(None),
):
    user_id = get_user_id(authorization)
    update_data = updates.model_dump(exclude_unset=True)

    document = await document_service.update_document(doc_id, user_id, update_data)

    if not document:
        raise HTTPException(
            status_code=404, detail="Document not found or no permission"
        )

    return document


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    success = await document_service.delete_document(doc_id, user_id)

    if not success:
        raise HTTPException(
            status_code=404, detail="Document not found or no permission"
        )

    return {"message": "Document deleted"}


@router.get("/{doc_id}/content")
async def get_document_content(
    doc_id: str, authorization: Optional[str] = Header(None)
):
    user_id = get_user_id(authorization)
    document = await document_service.get_document(doc_id, user_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    content = await document_service.get_content(doc_id)
    return content or {"type": "doc", "content": []}


@router.put("/{doc_id}/content")
async def save_document_content(
    doc_id: str,
    content: FirebaseDocumentContent,
    authorization: Optional[str] = Header(None),
):
    user_id = get_user_id(authorization)
    document = await document_service.get_document(doc_id, user_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    success = await document_service.save_content(doc_id, content.content)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to save content")

    return {"message": "Content saved"}


@router.post("/{doc_id}/share", response_model=ShareInvitation)
async def share_document(
    doc_id: str,
    invitation: ShareInvitationCreate,
    authorization: Optional[str] = Header(None),
):
    user_id = get_user_id(authorization)

    if user_id != invitation.owner_id:
        raise HTTPException(status_code=403, detail="Can only share your own documents")

    result = await document_service.share_document(
        doc_id,
        invitation.owner_id,
        invitation.invitee_email,
        invitation.permission_level.value,
    )

    if not result:
        raise HTTPException(
            status_code=404, detail="Document not found or no permission"
        )

    return result
