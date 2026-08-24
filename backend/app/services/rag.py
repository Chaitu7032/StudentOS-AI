import re
import uuid
from dataclasses import dataclass
from typing import List, Tuple

from rank_bm25 import BM25Okapi
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.document import Document, DocumentChunk
from app.services.document_parser import extract_sections_from_bytes
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
    source_type: str = "document"
    page: int | None = None
    url: str | None = None


def tokenize_for_bm25(text: str) -> list[str]:
    """Tokenize query and documents for BM25 keyword matching."""
    return re.findall(r"\w+", text.lower())


def build_rag_context(chunks: list[RetrievedChunk]) -> tuple[str, list[dict]]:
    """Build formatted context string and structured citation metadata."""
    if not chunks:
        return "", []

    context_parts = []
    citations = []

    for i, chunk in enumerate(chunks, start=1):
        source_label = chunk.document_title
        if chunk.page:
            source_label += f", Page {chunk.page}"
        elif chunk.chunk_index is not None:
            source_label += f", Section {chunk.chunk_index + 1}"

        context_parts.append(f"[{i}] (Source: {source_label})\n{chunk.content}")
        citations.append(
            {
                "index": i,
                "document_id": str(chunk.document_id),
                "document_title": chunk.document_title,
                "chunk_index": chunk.chunk_index,
                "snippet": chunk.content[:220] + ("..." if len(chunk.content) > 220 else ""),
                "score": round(chunk.score, 3),
                "page": chunk.page,
                "url": chunk.url,
            }
        )

    context = "\n\n---\n\n".join(context_parts)
    return context, citations


def build_web_context(web_results: list[dict], start_index: int = 1) -> tuple[str, list[dict]]:
    """Format real-time web search results with index numbers and citations."""
    if not web_results:
        return "", []

    parts = []
    citations = []
    for i, res in enumerate(web_results, start=start_index):
        title = res.get("title", "Web Source")
        link = res.get("link", "")
        snippet = res.get("snippet", "")
        parts.append(f"[{i}] (Web: {title} - {link})\n{snippet}")
        citations.append(
            {
                "index": i,
                "document_id": f"web-{i}",
                "document_title": title,
                "chunk_index": 0,
                "snippet": snippet[:220] + ("..." if len(snippet) > 220 else ""),
                "score": 0.95,
                "url": link,
            }
        )
    return "\n\n---\n\n".join(parts), citations


RAG_INSTRUCTIONS = """
KNOWLEDGE BASE CONTEXT (Student Notes & Materials):
{context}

CITATION GUIDELINES:
- Synthesize responses using the provided source context whenever relevant.
- Cite sources inline using [1], [2], etc., corresponding precisely to the reference numbers above.
- If the student asks about their notes, prioritize citing the exact source sections/pages.
- Do not fabricate citations; only reference indices provided in the context blocks.
"""

WEB_SEARCH_INSTRUCTIONS = """
REAL-TIME WEB SEARCH CONTEXT:
{context}

WEB CITATION GUIDELINES:
- Integrate the latest real-time information provided above.
- Cite web sources using their respective bracketed numbers (e.g. [1], [2]).
"""


async def search_knowledge(
    db: AsyncSession,
    user_id: uuid.UUID,
    query: str,
    top_k: int | None = None,
    document_ids: list[uuid.UUID] | None = None,
) -> list[RetrievedChunk]:
    """Hybrid search combining pgvector dense cosine distance with BM25 keyword matching."""
    k = top_k or settings.rag_top_k
    query_vector = await embed_query(query)
    distance = DocumentChunk.embedding.cosine_distance(query_vector)

    # Fetch candidate pool (2x top_k) for dense search
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
        .limit(max(k * 3, 15))
    )

    if document_ids:
        stmt = stmt.where(Document.id.in_(document_ids))

    result = await db.execute(stmt)
    rows = result.all()

    if not rows:
        return []

    # Dense candidate dictionary
    candidate_map: dict[uuid.UUID, RetrievedChunk] = {}
    corpus_docs: list[list[str]] = []
    chunk_keys: list[uuid.UUID] = []

    for chunk, doc_title, score in rows:
        dense_score = float(score) if score is not None else 0.0
        candidate_map[chunk.id] = RetrievedChunk(
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            document_title=doc_title,
            chunk_index=chunk.chunk_index,
            content=chunk.content,
            score=dense_score,
            page=None,
        )
        corpus_docs.append(tokenize_for_bm25(chunk.content))
        chunk_keys.append(chunk.id)

    # Run BM25 keyword scoring over candidate chunks
    query_tokens = tokenize_for_bm25(query)
    if query_tokens and corpus_docs:
        try:
            bm25 = BM25Okapi(corpus_docs)
            bm25_scores = bm25.get_scores(query_tokens)
            max_bm25 = max(bm25_scores) if len(bm25_scores) > 0 and max(bm25_scores) > 0 else 1.0
            
            # Combine scores: 0.65 dense + 0.35 normalized BM25
            for idx, c_id in enumerate(chunk_keys):
                norm_bm25 = bm25_scores[idx] / max_bm25 if max_bm25 > 0 else 0
                dense_score = candidate_map[c_id].score
                combined = (dense_score * 0.65) + (norm_bm25 * 0.35)
                candidate_map[c_id].score = combined
        except Exception:
            pass

    # Filter and sort
    sorted_chunks = sorted(
        candidate_map.values(),
        key=lambda x: x.score,
        reverse=True,
    )

    filtered = [
        c for c in sorted_chunks
        if c.score >= (settings.rag_min_score * 0.85)  # slightly more permissive for hybrid
    ]
    return filtered[:k]


async def ingest_document(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    content: bytes | str,
    file_type: str,
) -> Document:
    """Process and index document with chunking, metadata, and embeddings."""
    from app.services.chunking import split_text

    raw_bytes = content.encode("utf-8") if isinstance(content, str) else content
    sections = extract_sections_from_bytes(raw_bytes, file_type)
    
    all_chunks: list[str] = []
    for sec in sections:
        chunks = split_text(sec.text)
        all_chunks.extend(chunks)

    if not all_chunks:
        raise ValueError("Document has no extractable text content.")

    full_text = "\n\n".join(s.text for s in sections)

    doc = Document(
        user_id=user_id,
        title=title[:255],
        file_type=file_type,
        content=full_text[:50000] if len(full_text) > 50000 else full_text,
        chunk_count=len(all_chunks),
    )
    db.add(doc)
    await db.flush()

    # Generate embeddings in batches
    embeddings = await embed_texts(all_chunks)

    for idx, (chunk_text, embedding) in enumerate(zip(all_chunks, embeddings)):
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
