import json
from collections.abc import AsyncGenerator
from typing import Any

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import get_settings
from app.security.validators import safe_error_message
from app.services.prompts import build_system_prompt, sanitize_user_input

settings = get_settings()


def _configure() -> None:
    if settings.gemini_api_key:
        genai.configure(api_key=settings.gemini_api_key)


def _build_history(messages: list[dict[str, str]]) -> list[dict[str, Any]]:
    history = []
    for msg in messages[-20:]:
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": [msg["content"]]})
    return history


async def stream_chat_response(
    user_message: str,
    learning_mode: str,
    history: list[dict[str, str]],
    rag_context: str | None = None,
    citations: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Stream Gemini response as Server-Sent Events data chunks."""
    if not settings.gemini_api_key:
        yield _sse({"error": "GEMINI_API_KEY not configured"})
        yield _sse("[DONE]")
        return

    _configure()
    sanitized = sanitize_user_input(user_message)
    system_prompt = build_system_prompt(learning_mode, rag_context)

    if citations:
        yield _sse({"citations": citations})

    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system_prompt,
    )

    chat_history = _build_history(history)
    chat = model.start_chat(history=chat_history)

    generation_config = GenerationConfig(
        temperature=0.7,
        top_p=0.95,
        max_output_tokens=8192,
    )

    try:
        response = await chat.send_message_async(
            sanitized,
            generation_config=generation_config,
            stream=True,
        )
        async for chunk in response:
            if chunk.text:
                yield _sse({"content": chunk.text})
    except Exception as exc:
        yield _sse({"error": safe_error_message(exc)})

    yield _sse("[DONE]")


def _sse(data: dict[str, Any] | str) -> str:
    if isinstance(data, str):
        return f"data: {json.dumps(data)}\n\n"
    return f"data: {json.dumps(data)}\n\n"
