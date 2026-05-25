import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

LearningMode = Literal[
    "beginner",
    "revision",
    "interview",
    "deep_dive",
    "exam_prep",
    "visual",
]


class ChatCreate(BaseModel):
    title: str | None = Field(default="New Chat", max_length=255)
    learning_mode: LearningMode = "beginner"


class ChatUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    learning_mode: LearningMode | None = None


class ChatResponse(BaseModel):
    id: uuid.UUID
    title: str
    learning_mode: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatDetailResponse(ChatResponse):
    messages: list[MessageResponse] = []


class ChatMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=32000)
    learning_mode: LearningMode | None = None
    use_knowledge: bool = False
    document_ids: list[uuid.UUID] | None = None
    topic_name: str | None = Field(default=None, max_length=255)
