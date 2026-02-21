from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from enum import Enum


class PermissionLevel(int, Enum):
    VIEWER = 1
    COMMENTER = 2
    EDITOR = 3
    OWNER = 4


class AIFeature(str, Enum):
    SUMMARIZE = "summarize"
    TRANSLATE = "translate"
    GRAMMAR_CHECK = "grammar-check"
    TONE_ADJUSTMENT = "tone-adjustment"
    EXPAND = "expand"
    SHORTEN = "shorten"
    GENERATE_OUTLINE = "generate-outline"
    HELP_ME_WRITE = "help-me-write"
    IMPROVE = "improve"


class FirebaseDocumentCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str = "Untitled Document"
    owner_id: str = Field(alias="ownerId")


class FirebaseDocumentUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: Optional[str] = None
    ai_consent: Optional[bool] = Field(default=None, alias="aiConsent")
    ai_features: Optional[List[str]] = Field(default=None, alias="aiFeatures")


class FirebaseDocumentContent(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    content: Dict[str, Any]


class FirebaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    owner_id: str = Field(alias="ownerId")
    permissions: Dict[str, int]
    content_hash: str = Field(default="", alias="contentHash")
    storage_path: str = Field(alias="storagePath")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    version: int = 1
    ai_consent: bool = Field(default=False, alias="aiConsent")
    ai_features: List[str] = Field(default_factory=list, alias="aiFeatures")
    is_deleted: bool = Field(default=False, alias="isDeleted")
    deleted_at: Optional[datetime] = Field(default=None, alias="deletedAt")


class AIRequestCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: str
    document_id: str
    feature: AIFeature
    input: Dict[str, Any] = Field(default_factory=dict)
    ai_consent: bool = Field(default=False, alias="aiConsent")


class AIRequestResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str = Field(alias="userId")
    document_id: str = Field(alias="documentId")
    feature: AIFeature
    status: str
    input: Dict[str, Any]
    output: Optional[Dict[str, Any]] = None
    tokens_used: Optional[int] = Field(default=None, alias="tokensUsed")
    created_at: datetime = Field(alias="createdAt")
    completed_at: Optional[datetime] = Field(default=None, alias="completedAt")
    error: Optional[str] = None


class ShareInvitationCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(alias="documentId")
    owner_id: str = Field(alias="ownerId")
    invitee_email: str = Field(alias="inviteeEmail")
    permission_level: PermissionLevel = Field(alias="permissionLevel")


class ShareInvitation(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    document_id: str = Field(alias="documentId")
    inviter_id: str = Field(alias="inviterId")
    invitee_email: str = Field(alias="inviteeEmail")
    permission_level: int = Field(alias="permissionLevel")
    status: str
    created_at: datetime = Field(alias="createdAt")
    expires_at: datetime = Field(alias="expiresAt")
