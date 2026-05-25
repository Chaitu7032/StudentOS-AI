import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    daily_goal_minutes: int | None = Field(default=None, ge=5, le=480)
    learning_goal: str | None = Field(default=None, max_length=500)


class ProfileResponse(BaseModel):
    study_streak: int
    longest_streak: int
    total_study_minutes: int
    daily_goal_minutes: int
    learning_goal: str | None
    last_active_date: date | None
    today_minutes: int = 0

    model_config = {"from_attributes": True}


class TopicCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(default="general", max_length=100)
    mastery_score: int = Field(default=0, ge=0, le=100)
    notes: str | None = None


class TopicUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    category: str | None = None
    mastery_score: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None
    practice: bool = False


class TopicResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: str
    mastery_score: int
    practice_count: int
    last_practiced_at: datetime | None
    is_weak: bool = False
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StudyTask(BaseModel):
    id: str
    title: str
    topic: str
    duration_minutes: int
    due_date: str
    completed: bool = False


class StudyPlanData(BaseModel):
    tasks: list[StudyTask] = []
    weekly_hours: int = 5
    focus_areas: list[str] = []


class StudyPlanGenerateRequest(BaseModel):
    weekly_hours: int = Field(default=5, ge=1, le=40)
    focus: str | None = Field(default=None, max_length=500)


class StudyPlanResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: str
    plan_data: dict
    ai_generated: bool
    created_at: datetime
    progress_percent: int = 0

    model_config = {"from_attributes": True}


class TaskCompleteRequest(BaseModel):
    task_id: str


class RevisionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    topic_id: uuid.UUID | None = None
    scheduled_date: date
    notes: str | None = None


class RevisionResponse(BaseModel):
    id: uuid.UUID
    title: str
    topic_id: uuid.UUID | None
    topic_name: str | None = None
    scheduled_date: date
    completed: bool
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MemoryCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MemoryResponse(BaseModel):
    id: uuid.UUID
    content: str
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityLog(BaseModel):
    minutes: int = Field(default=5, ge=1, le=180)
    topic_name: str | None = Field(default=None, max_length=255)


class ProgressOverview(BaseModel):
    profile: ProfileResponse
    total_chats: int
    total_messages: int
    topics_count: int
    weak_topics_count: int
    documents_count: int
    recommendations: list[str]
    upcoming_revisions: list[RevisionResponse]
