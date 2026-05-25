import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.knowledge import (
    DocumentDetailResponse,
    DocumentResponse,
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    TextUploadRequest,
)
from app.security.jwt import get_current_user
from app.security.rate_limit import UPLOAD_LIMIT, limiter
from app.security.validators import sanitize_filename
from app.services.document_parser import extract_text_from_bytes
from app.services.rag import ingest_document, search_knowledge

router = APIRouter(prefix="/knowledge", tags=["knowledge"])
settings = get_settings()

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown"}
MAX_BYTES = settings.max_upload_mb * 1024 * 1024


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .limit(100)
    )
    docs = result.scalars().all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/documents/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    preview = None
    if doc.content:
        preview = doc.content[:500] + ("..." if len(doc.content) > 500 else "")
    return DocumentDetailResponse(
        id=doc.id,
        title=doc.title,
        file_type=doc.file_type,
        chunk_count=doc.chunk_count,
        created_at=doc.created_at,
        content_preview=preview,
    )


@router.post("/documents/text", response_model=DocumentResponse, status_code=201)
async def upload_text(
    data: TextUploadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        doc = await ingest_document(
            db,
            current_user.id,
            data.title,
            data.content,
            "text",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return DocumentResponse.model_validate(doc)


@router.post("/documents/upload", response_model=DocumentResponse, status_code=201)
@limiter.limit(UPLOAD_LIMIT)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Supported formats: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max {settings.max_upload_mb}MB",
        )

    file_type = ext.lstrip(".")
    try:
        content = extract_text_from_bytes(data, file_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    safe_name = sanitize_filename(file.filename)
    doc_title = (title or safe_name).strip()[:255]
    try:
        doc = await ingest_document(
            db,
            current_user.id,
            doc_title,
            content,
            file_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return DocumentResponse.model_validate(doc)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)


@router.post("/search", response_model=SearchResponse)
async def semantic_search(
    data: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chunks = await search_knowledge(
        db,
        current_user.id,
        data.query,
        top_k=data.top_k,
        document_ids=data.document_ids,
    )
    return SearchResponse(
        query=data.query,
        results=[
            SearchResultItem(
                document_id=c.document_id,
                document_title=c.document_title,
                chunk_index=c.chunk_index,
                content=c.content,
                score=c.score,
            )
            for c in chunks
        ],
    )


@router.get("/stats")
async def knowledge_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.document import DocumentChunk

    doc_count = await db.scalar(
        select(func.count(Document.id)).where(Document.user_id == current_user.id)
    )
    chunk_count = await db.scalar(
        select(func.count(DocumentChunk.id))
        .join(Document)
        .where(Document.user_id == current_user.id)
    )
    return {
        "document_count": doc_count or 0,
        "chunk_count": chunk_count or 0,
    }
