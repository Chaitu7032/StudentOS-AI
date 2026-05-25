import asyncio
from functools import lru_cache

from app.config import get_settings

settings = get_settings()
_model = None
_model_lock = asyncio.Lock()


@lru_cache(maxsize=1)
def _load_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.embedding_model)


async def get_embedding_model():
    global _model
    if _model is not None:
        return _model
    async with _model_lock:
        if _model is None:
            loop = asyncio.get_event_loop()
            _model = await loop.run_in_executor(None, _load_model)
    return _model


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    model = await get_embedding_model()
    loop = asyncio.get_event_loop()

    def _encode():
        vectors = model.encode(texts, normalize_embeddings=True)
        return [v.tolist() for v in vectors]

    return await loop.run_in_executor(None, _encode)


async def embed_query(query: str) -> list[float]:
    results = await embed_texts([query])
    return results[0]
