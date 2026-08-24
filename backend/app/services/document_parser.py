from dataclasses import dataclass
from io import BytesIO
import re
from pypdf import PdfReader


@dataclass
class ExtractedSection:
    text: str
    page_number: int | None = None


def clean_text(text: str) -> str:
    """Normalize whitespace and remove non-printable characters."""
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_sections_from_pdf(data: bytes) -> list[ExtractedSection]:
    reader = PdfReader(BytesIO(data))
    sections: list[ExtractedSection] = []
    
    for idx, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
            cleaned = clean_text(page_text)
            if cleaned:
                sections.append(ExtractedSection(text=cleaned, page_number=idx))
        except Exception:
            continue
            
    if not sections:
        raise ValueError("No readable text could be extracted from this PDF. Please check if it is scanned or protected.")
    return sections


def extract_sections_from_bytes(data: bytes, file_type: str) -> list[ExtractedSection]:
    ft = file_type.lower().lstrip(".")
    if ft == "pdf":
        return extract_sections_from_pdf(data)
    if ft in ("txt", "md", "markdown", "text", "csv", "json", "py", "js", "ts"):
        raw_text = data.decode("utf-8", errors="replace")
        cleaned = clean_text(raw_text)
        if not cleaned:
            raise ValueError("Document appears to be empty.")
        return [ExtractedSection(text=cleaned, page_number=1)]
    raise ValueError(f"Unsupported file format: {file_type}")


def extract_text_from_bytes(data: bytes, file_type: str) -> str:
    sections = extract_sections_from_bytes(data, file_type)
    return "\n\n".join(s.text for s in sections)
