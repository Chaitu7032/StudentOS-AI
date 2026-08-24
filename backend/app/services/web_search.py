import asyncio
import logging
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)


async def search_web(query: str, max_results: int = 5) -> list[dict]:
    """Execute asynchronous web search using DuckDuckGo with fallback and error tolerance."""
    def _search_sync():
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
                return [
                    {
                        "title": r.get("title", "").strip(),
                        "link": r.get("href", "").strip(),
                        "snippet": r.get("body", "").strip(),
                    }
                    for r in results
                    if r.get("body")
                ]
        except Exception as e:
            logger.warning(f"DuckDuckGo search error: {e}")
            return []

    try:
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, _search_sync)
        return results
    except Exception as exc:
        logger.error(f"Async search error: {exc}")
        return []
