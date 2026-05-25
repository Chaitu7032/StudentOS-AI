from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings

settings = get_settings()


def split_text(text: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(text.strip())
    return [c.strip() for c in chunks if c.strip()]
