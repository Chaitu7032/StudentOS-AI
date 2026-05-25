import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.chat import Chat, Message
from app.models.user import User
from app.schemas.chat import (
    ChatCreate,
    ChatDetailResponse,
    ChatMessageRequest,
    ChatResponse,
    ChatUpdate,
    MessageResponse,
)
from app.security.jwt import get_current_user
from app.security.rate_limit import CHAT_STREAM_LIMIT, limiter
from app.services.analytics import record_activity
from app.services.gemini import stream_chat_response
from app.services.rag import build_rag_context, search_knowledge

router = APIRouter(prefix="/chats", tags=["chats"])


def _chat_to_response(chat: Chat, message_count: int = 0) -> ChatResponse:
    return ChatResponse(
        id=chat.id,
        title=chat.title,
        learning_mode=chat.learning_mode,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        message_count=message_count,
    )


@router.get("", response_model=list[ChatResponse])
async def list_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Chat, func.count(Message.id).label("msg_count"))
        .outerjoin(Message)
        .where(Chat.user_id == current_user.id)
        .group_by(Chat.id)
        .order_by(Chat.updated_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        _chat_to_response(chat, msg_count)
        for chat, msg_count in rows
    ]


@router.post("", response_model=ChatResponse, status_code=201)
async def create_chat(
    data: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat = Chat(
        user_id=current_user.id,
        title=data.title or "New Chat",
        learning_mode=data.learning_mode,
    )
    db.add(chat)
    await db.flush()
    await db.refresh(chat)
    return _chat_to_response(chat, 0)


@router.get("/{chat_id}", response_model=ChatDetailResponse)
async def get_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chat)
        .options(selectinload(Chat.messages))
        .where(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return ChatDetailResponse(
        **_chat_to_response(chat, len(chat.messages)).model_dump(),
        messages=[MessageResponse.model_validate(m) for m in chat.messages],
    )


@router.patch("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: uuid.UUID,
    data: ChatUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if data.title is not None:
        chat.title = data.title
    if data.learning_mode is not None:
        chat.learning_mode = data.learning_mode
    await db.flush()
    await db.refresh(chat)
    return _chat_to_response(chat)


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await db.delete(chat)


@router.post("/{chat_id}/messages/stream")
@limiter.limit(CHAT_STREAM_LIMIT)
async def stream_message(
    request: Request,
    chat_id: uuid.UUID,
    data: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chat)
        .options(selectinload(Chat.messages))
        .where(Chat.id == chat_id, Chat.user_id == current_user.id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    mode = data.learning_mode or chat.learning_mode
    if data.learning_mode:
        chat.learning_mode = data.learning_mode

    user_msg = Message(chat_id=chat.id, role="user", content=data.content)
    db.add(user_msg)
    await db.flush()

    await record_activity(
        db,
        current_user.id,
        minutes=5,
        topic_name=data.topic_name or (chat.title if chat.title != "New Chat" else None),
    )

    history = [{"role": m.role, "content": m.content} for m in chat.messages]
    history.append({"role": "user", "content": data.content})

    rag_context: str | None = None
    citations: list[dict] = []

    if data.use_knowledge:
        retrieved = await search_knowledge(
            db,
            current_user.id,
            data.content,
            document_ids=data.document_ids,
        )
        if retrieved:
            rag_context, citations = build_rag_context(retrieved)

    assistant_parts: list[str] = []

    async def event_generator():
        nonlocal assistant_parts
        async for chunk in stream_chat_response(
            data.content,
            mode,
            history[:-1],
            rag_context=rag_context,
            citations=citations if citations else None,
        ):
            yield chunk
            if chunk.startswith("data: "):
                payload = chunk[6:].strip()
                if payload == '"[DONE]"' or payload == "[DONE]":
                    continue
                try:
                    parsed = json.loads(payload)
                    if "content" in parsed:
                        assistant_parts.append(parsed["content"])
                except json.JSONDecodeError:
                    pass

        full_response = "".join(assistant_parts)
        if full_response:
            assistant_msg = Message(
                chat_id=chat.id, role="assistant", content=full_response
            )
            db.add(assistant_msg)
            if chat.title == "New Chat" and len(chat.messages) <= 1:
                chat.title = data.content[:60] + (
                    "..." if len(data.content) > 60 else ""
                )
            await db.flush()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
