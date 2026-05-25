import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    id: uuid.UUID
    title: str
    file_type: str | None
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetailResponse(DocumentResponse):
    content_preview: str | None = None


class TextUploadRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=10, max_length=500000)


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)
    document_ids: list[uuid.UUID] | None = None


class SearchResultItem(BaseModel):
    document_id: uuid.UUID
    document_title: str
    chunk_index: int
    content: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    query: str
