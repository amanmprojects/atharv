import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.schemas.analysis import Document, DocumentCreate

router = APIRouter()

documents_db = {}

@router.get("/", response_model=List[Document])
async def list_documents():
    return list(documents_db.values())

@router.post("/", response_model=Document)
async def create_document(doc: DocumentCreate):
    doc_id = str(uuid.uuid4())
    word_count = len(doc.content.split())
    
    new_doc = Document(
        id=doc_id,
        title=doc.title,
        content=doc.content,
        genre=doc.genre,
        word_count=word_count,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    documents_db[doc_id] = new_doc
    return new_doc

@router.get("/{doc_id}", response_model=Document)
async def get_document(doc_id: str):
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    return documents_db[doc_id]

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    del documents_db[doc_id]
    return {"message": "Document deleted"}
