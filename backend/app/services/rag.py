import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.document import Document, DocumentChunk
from app.services.embeddings import embed_query, embed_texts

settings = get_settings()


@dataclass
class RetrievedChunk:
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    chunk_index: int
    content: str
    score: float


def build_rag_context(chunks: list[RetrievedChunk]) -> tuple[str, list[dict]]:
    """Build context string and citation metadata for the LLM."""
    if not chunks:
        return "", []

    context_parts = []
    citations = []

    for i, chunk in enumerate(chunks, start=1):
        context_parts.append(
            f"[{i}] (Source: {chunk.document_title}, section {chunk.chunk_index + 1})\n{chunk.content}"
        )
        citations.append(
            {
                "index": i,
                "document_id": str(chunk.document_id),
                "document_title": chunk.document_title,
                "chunk_index": chunk.chunk_index,
                "snippet": chunk.content[:200] + ("..." if len(chunk.content) > 200 else ""),
                "score": round(chunk.score, 3),
            }
        )

    context = "\n\n---\n\n".join(context_parts)
    return context, citations


RAG_INSTRUCTIONS = """
KNOWLEDGE BASE CONTEXT (use when answering):
The following excerpts are from the student's uploaded notes and documents.
- Answer using this context when relevant
- Cite sources inline using [1], [2], etc. matching the excerpt numbers
- If context doesn't contain the answer, say so and use your general knowledge
- Never invent citations; only cite provided excerpts

{context}
"""


async def search_knowledge(
    db: AsyncSession,
    user_id: uuid.UUID,
    query: str,
    top_k: int | None = None,
    document_ids: list[uuid.UUID] | None = None,
) -> list[RetrievedChunk]:
    query_vector = await embed_query(query)
    k = top_k or settings.rag_top_k

    distance = DocumentChunk.embedding.cosine_distance(query_vector)

    stmt = (
        select(
            DocumentChunk,
            Document.title,
            (1 - distance).label("score"),
        )
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(
            Document.user_id == user_id,
            DocumentChunk.embedding.isnot(None),
        )
        .order_by(distance)
        .limit(k)
    )

    if document_ids:
        stmt = stmt.where(Document.id.in_(document_ids))

    result = await db.execute(stmt)
    rows = result.all()

    chunks: list[RetrievedChunk] = []
    for chunk, doc_title, score in rows:
        if score is None or float(score) < settings.rag_min_score:
            continue
        chunks.append(
            RetrievedChunk(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_title=doc_title,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                score=float(score),
            )
        )
    return chunks


async def ingest_document(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    content: str,
    file_type: str,
) -> Document:
    from app.services.chunking import split_text

    text_chunks = split_text(content)
    if not text_chunks:
        raise ValueError("Document has no extractable text")

    doc = Document(
        user_id=user_id,
        title=title[:255],
        file_type=file_type,
        content=content[:50000] if len(content) > 50000 else content,
        chunk_count=len(text_chunks),
    )
    db.add(doc)
    await db.flush()

    embeddings = await embed_texts(text_chunks)

    for idx, (chunk_text, embedding) in enumerate(zip(text_chunks, embeddings)):
        db.add(
            DocumentChunk(
                document_id=doc.id,
                chunk_index=idx,
                content=chunk_text,
                embedding=embedding,
            )
        )

    await db.flush()
    await db.refresh(doc)
    return doc
