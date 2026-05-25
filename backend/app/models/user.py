import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    chats: Mapped[list["Chat"]] = relationship(  # noqa: F821
        "Chat", back_populates="user", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(  # noqa: F821
        "Document", back_populates="user", cascade="all, delete-orphan"
    )
    learning_profile: Mapped["LearningProfile | None"] = relationship(  # noqa: F821
        "LearningProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    topics: Mapped[list["UserTopic"]] = relationship(  # noqa: F821
        "UserTopic", back_populates="user", cascade="all, delete-orphan"
    )
    study_plans: Mapped[list["StudyPlan"]] = relationship(  # noqa: F821
        "StudyPlan", back_populates="user", cascade="all, delete-orphan"
    )
    revisions: Mapped[list["RevisionItem"]] = relationship(  # noqa: F821
        "RevisionItem", back_populates="user", cascade="all, delete-orphan"
    )
    memories: Mapped[list["LearningMemory"]] = relationship(  # noqa: F821
        "LearningMemory", back_populates="user", cascade="all, delete-orphan"
    )
