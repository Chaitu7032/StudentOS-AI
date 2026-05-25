from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf(data: bytes) -> str:
    reader = PdfReader(BytesIO(data))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    content = "\n\n".join(pages).strip()
    if not content:
        raise ValueError("No text could be extracted from this PDF")
    return content


def extract_text_from_bytes(data: bytes, file_type: str) -> str:
    ft = file_type.lower().lstrip(".")
    if ft == "pdf":
        return extract_text_from_pdf(data)
    if ft in ("txt", "md", "markdown", "text"):
        return data.decode("utf-8", errors="replace").strip()
    raise ValueError(f"Unsupported file type: {file_type}")
