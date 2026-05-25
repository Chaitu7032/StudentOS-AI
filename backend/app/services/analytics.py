import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Chat, Message
from app.models.document import Document
from app.models.progress import LearningProfile, RevisionItem, UserTopic
from app.models.user import User
from app.schemas.progress import ProfileResponse, RevisionResponse, TopicResponse

WEAK_MASTERY_THRESHOLD = 50
STALE_DAYS = 7


def is_weak_topic(topic: UserTopic) -> bool:
    if topic.mastery_score < WEAK_MASTERY_THRESHOLD:
        return True
    if topic.last_practiced_at is None:
        return topic.practice_count == 0
    stale = datetime.now(timezone.utc) - topic.last_practiced_at
    return stale > timedelta(days=STALE_DAYS) and topic.mastery_score < 70


def topic_to_response(topic: UserTopic) -> TopicResponse:
    return TopicResponse(
        id=topic.id,
        name=topic.name,
        category=topic.category,
        mastery_score=topic.mastery_score,
        practice_count=topic.practice_count,
        last_practiced_at=topic.last_practiced_at,
        is_weak=is_weak_topic(topic),
        notes=topic.notes,
        created_at=topic.created_at,
    )


async def get_or_create_profile(db: AsyncSession, user_id: uuid.UUID) -> LearningProfile:
    result = await db.execute(
        select(LearningProfile).where(LearningProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = LearningProfile(user_id=user_id)
        db.add(profile)
        await db.flush()
        await db.refresh(profile)
    return profile


async def record_activity(
    db: AsyncSession,
    user_id: uuid.UUID,
    minutes: int = 5,
    topic_name: str | None = None,
) -> LearningProfile:
    profile = await get_or_create_profile(db, user_id)
    today = date.today()

    if profile.last_active_date == today:
        profile.minutes_today += minutes
    elif profile.last_active_date == today - timedelta(days=1):
        profile.study_streak += 1
        profile.minutes_today = minutes
    elif profile.last_active_date is None:
        profile.study_streak = 1
        profile.minutes_today = minutes
    else:
        profile.study_streak = 1
        profile.minutes_today = minutes

    profile.last_active_date = today
    profile.longest_streak = max(profile.longest_streak, profile.study_streak)
    profile.total_study_minutes += minutes

    if topic_name:
        result = await db.execute(
            select(UserTopic).where(
                UserTopic.user_id == user_id,
                UserTopic.name.ilike(topic_name.strip()),
            )
        )
        topic = result.scalar_one_or_none()
        if topic is None:
            topic = UserTopic(
                user_id=user_id,
                name=topic_name.strip()[:255],
                mastery_score=10,
                practice_count=1,
                last_practiced_at=datetime.now(timezone.utc),
            )
            db.add(topic)
        else:
            topic.practice_count += 1
            topic.last_practiced_at = datetime.now(timezone.utc)
            topic.mastery_score = min(100, topic.mastery_score + 3)

    await db.flush()
    return profile


def build_recommendations(
    profile: LearningProfile,
    weak_topics: list[UserTopic],
    upcoming_revisions: int,
) -> list[str]:
    recs: list[str] = []

    if profile.study_streak == 0:
        recs.append("Start a chat session today to begin your study streak.")
    elif profile.study_streak >= 3:
        recs.append(f"Great {profile.study_streak}-day streak! Keep the momentum going.")

    if weak_topics:
        names = ", ".join(t.name for t in weak_topics[:3])
        recs.append(f"Focus on weak topics: {names}. Try Revision mode in AI Tutor.")
    else:
        recs.append("Add topics you are studying to track mastery and get tailored plans.")

    if profile.last_active_date == date.today():
        remaining = max(0, profile.daily_goal_minutes - profile.minutes_today)
        if remaining > 0:
            recs.append(
                f"You're {remaining} min away from today's {profile.daily_goal_minutes} min goal."
            )

    if upcoming_revisions > 0:
        recs.append(f"You have {upcoming_revisions} revision session(s) scheduled — don't skip them!")

    if not profile.learning_goal:
        recs.append("Set a learning goal in Progress settings for smarter AI study plans.")

    return recs[:5]


async def get_progress_overview(db: AsyncSession, user: User) -> dict:
    profile = await get_or_create_profile(db, user.id)

    chat_count = await db.scalar(
        select(func.count(Chat.id)).where(Chat.user_id == user.id)
    )
    msg_count = await db.scalar(
        select(func.count(Message.id))
        .join(Chat)
        .where(Chat.user_id == user.id)
    )
    doc_count = await db.scalar(
        select(func.count(Document.id)).where(Document.user_id == user.id)
    )

    topics_result = await db.execute(
        select(UserTopic).where(UserTopic.user_id == user.id).order_by(UserTopic.mastery_score)
    )
    topics = list(topics_result.scalars().all())
    weak = [t for t in topics if is_weak_topic(t)]

    today = date.today()
    rev_result = await db.execute(
        select(RevisionItem)
        .where(
            RevisionItem.user_id == user.id,
            RevisionItem.completed.is_(False),
            RevisionItem.scheduled_date >= today,
        )
        .order_by(RevisionItem.scheduled_date)
        .limit(5)
    )
    revisions = list(rev_result.scalars().all())

    rev_responses = []
    for r in revisions:
        topic_name = None
        if r.topic_id:
            t = next((x for x in topics if x.id == r.topic_id), None)
            topic_name = t.name if t else None
        rev_responses.append(
            RevisionResponse(
                id=r.id,
                title=r.title,
                topic_id=r.topic_id,
                topic_name=topic_name,
                scheduled_date=r.scheduled_date,
                completed=r.completed,
                notes=r.notes,
                created_at=r.created_at,
            )
        )

    profile_resp = ProfileResponse(
        study_streak=profile.study_streak,
        longest_streak=profile.longest_streak,
        total_study_minutes=profile.total_study_minutes,
        daily_goal_minutes=profile.daily_goal_minutes,
        learning_goal=profile.learning_goal,
        last_active_date=profile.last_active_date,
        today_minutes=profile.minutes_today if profile.last_active_date == today else 0,
    )

    return {
        "profile": profile_resp,
        "total_chats": chat_count or 0,
        "total_messages": msg_count or 0,
        "topics_count": len(topics),
        "weak_topics_count": len(weak),
        "documents_count": doc_count or 0,
        "recommendations": build_recommendations(profile, weak, len(revisions)),
        "upcoming_revisions": rev_responses,
    }


def plan_progress_percent(plan_data: dict) -> int:
    tasks = plan_data.get("tasks", [])
    if not tasks:
        return 0
    done = sum(1 for t in tasks if t.get("completed"))
    return int((done / len(tasks)) * 100)
