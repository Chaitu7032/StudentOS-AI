import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.progress import LearningMemory, RevisionItem, StudyPlan, UserTopic
from app.models.user import User
from app.schemas.progress import (
    ActivityLog,
    MemoryCreate,
    MemoryResponse,
    ProfileResponse,
    ProfileUpdate,
    ProgressOverview,
    RevisionCreate,
    RevisionResponse,
    StudyPlanGenerateRequest,
    StudyPlanResponse,
    TaskCompleteRequest,
    TopicCreate,
    TopicResponse,
    TopicUpdate,
)
from app.security.jwt import get_current_user
from app.security.rate_limit import AI_PLAN_LIMIT, limiter
from app.services.analytics import (
    get_or_create_profile,
    get_progress_overview,
    plan_progress_percent,
    record_activity,
    topic_to_response,
)
from app.services.study_planner import generate_study_plan

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/overview", response_model=ProgressOverview)
async def overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await get_progress_overview(db, current_user)
    return ProgressOverview(**data)


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_profile(db, current_user.id)
    return ProfileResponse(
        study_streak=profile.study_streak,
        longest_streak=profile.longest_streak,
        total_study_minutes=profile.total_study_minutes,
        daily_goal_minutes=profile.daily_goal_minutes,
        learning_goal=profile.learning_goal,
        last_active_date=profile.last_active_date,
        today_minutes=profile.minutes_today,
    )


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_profile(db, current_user.id)
    if data.daily_goal_minutes is not None:
        profile.daily_goal_minutes = data.daily_goal_minutes
    if data.learning_goal is not None:
        profile.learning_goal = data.learning_goal
    await db.flush()
    return ProfileResponse(
        study_streak=profile.study_streak,
        longest_streak=profile.longest_streak,
        total_study_minutes=profile.total_study_minutes,
        daily_goal_minutes=profile.daily_goal_minutes,
        learning_goal=profile.learning_goal,
        last_active_date=profile.last_active_date,
        today_minutes=profile.minutes_today,
    )


@router.post("/activity", response_model=ProfileResponse)
async def log_activity(
    data: ActivityLog,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await record_activity(
        db, current_user.id, data.minutes, data.topic_name
    )
    return ProfileResponse(
        study_streak=profile.study_streak,
        longest_streak=profile.longest_streak,
        total_study_minutes=profile.total_study_minutes,
        daily_goal_minutes=profile.daily_goal_minutes,
        learning_goal=profile.learning_goal,
        last_active_date=profile.last_active_date,
        today_minutes=profile.minutes_today,
    )


@router.get("/topics", response_model=list[TopicResponse])
async def list_topics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserTopic)
        .where(UserTopic.user_id == current_user.id)
        .order_by(UserTopic.mastery_score.asc())
    )
    return [topic_to_response(t) for t in result.scalars().all()]


@router.post("/topics", response_model=TopicResponse, status_code=201)
async def create_topic(
    data: TopicCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    topic = UserTopic(
        user_id=current_user.id,
        name=data.name.strip(),
        category=data.category,
        mastery_score=data.mastery_score,
        notes=data.notes,
    )
    db.add(topic)
    await db.flush()
    await db.refresh(topic)
    return topic_to_response(topic)


@router.patch("/topics/{topic_id}", response_model=TopicResponse)
async def update_topic(
    topic_id: uuid.UUID,
    data: TopicUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone

    result = await db.execute(
        select(UserTopic).where(
            UserTopic.id == topic_id,
            UserTopic.user_id == current_user.id,
        )
    )
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if data.name is not None:
        topic.name = data.name.strip()
    if data.category is not None:
        topic.category = data.category
    if data.mastery_score is not None:
        topic.mastery_score = data.mastery_score
    if data.notes is not None:
        topic.notes = data.notes
    if data.practice:
        topic.practice_count += 1
        topic.last_practiced_at = datetime.now(timezone.utc)
        topic.mastery_score = min(100, topic.mastery_score + 5)

    await db.flush()
    return topic_to_response(topic)


@router.delete("/topics/{topic_id}", status_code=204)
async def delete_topic(
    topic_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserTopic).where(
            UserTopic.id == topic_id,
            UserTopic.user_id == current_user.id,
        )
    )
    topic = result.scalar_one_or_none()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    await db.delete(topic)


@router.get("/study-plans", response_model=list[StudyPlanResponse])
async def list_study_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudyPlan)
        .where(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.created_at.desc())
        .limit(10)
    )
    plans = result.scalars().all()
    return [
        StudyPlanResponse(
            id=p.id,
            title=p.title,
            description=p.description,
            status=p.status,
            plan_data=p.plan_data or {},
            ai_generated=p.ai_generated,
            created_at=p.created_at,
            progress_percent=plan_progress_percent(p.plan_data or {}),
        )
        for p in plans
    ]


@router.post("/study-plans/generate", response_model=StudyPlanResponse, status_code=201)
@limiter.limit(AI_PLAN_LIMIT)
async def generate_plan(
    request: Request,
    data: StudyPlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.analytics import is_weak_topic

    profile = await get_or_create_profile(db, current_user.id)
    topics_result = await db.execute(
        select(UserTopic).where(UserTopic.user_id == current_user.id)
    )
    all_topics = list(topics_result.scalars().all())
    weak = [t for t in all_topics if is_weak_topic(t)]

    generated = await generate_study_plan(
        weak,
        all_topics,
        profile.learning_goal,
        data.weekly_hours,
        data.focus,
    )

    plan = StudyPlan(
        user_id=current_user.id,
        title=generated["title"],
        description=generated.get("description"),
        plan_data=generated["plan_data"],
        ai_generated=True,
        status="active",
    )
    db.add(plan)
    await db.flush()
    await db.refresh(plan)

    return StudyPlanResponse(
        id=plan.id,
        title=plan.title,
        description=plan.description,
        status=plan.status,
        plan_data=plan.plan_data,
        ai_generated=plan.ai_generated,
        created_at=plan.created_at,
        progress_percent=0,
    )


@router.patch("/study-plans/{plan_id}/tasks", response_model=StudyPlanResponse)
async def complete_task(
    plan_id: uuid.UUID,
    data: TaskCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudyPlan).where(
            StudyPlan.id == plan_id,
            StudyPlan.user_id == current_user.id,
        )
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")

    plan_data = dict(plan.plan_data or {})
    tasks = list(plan_data.get("tasks", []))
    for task in tasks:
        if task.get("id") == data.task_id:
            task["completed"] = True
            break
    plan_data["tasks"] = tasks
    plan.plan_data = plan_data

    if all(t.get("completed") for t in tasks) and tasks:
        plan.status = "completed"

    await db.flush()
    return StudyPlanResponse(
        id=plan.id,
        title=plan.title,
        description=plan.description,
        status=plan.status,
        plan_data=plan.plan_data,
        ai_generated=plan.ai_generated,
        created_at=plan.created_at,
        progress_percent=plan_progress_percent(plan.plan_data),
    )


@router.get("/revisions", response_model=list[RevisionResponse])
async def list_revisions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RevisionItem)
        .options(selectinload(RevisionItem.topic))
        .where(RevisionItem.user_id == current_user.id)
        .order_by(RevisionItem.scheduled_date)
    )
    items = []
    for r in result.scalars().all():
        items.append(
            RevisionResponse(
                id=r.id,
                title=r.title,
                topic_id=r.topic_id,
                topic_name=r.topic.name if r.topic else None,
                scheduled_date=r.scheduled_date,
                completed=r.completed,
                notes=r.notes,
                created_at=r.created_at,
            )
        )
    return items


@router.post("/revisions", response_model=RevisionResponse, status_code=201)
async def create_revision(
    data: RevisionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.scheduled_date < date.today():
        raise HTTPException(status_code=400, detail="Scheduled date must be today or later")

    item = RevisionItem(
        user_id=current_user.id,
        topic_id=data.topic_id,
        title=data.title.strip(),
        scheduled_date=data.scheduled_date,
        notes=data.notes,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    topic_name = None
    if data.topic_id:
        t = await db.get(UserTopic, data.topic_id)
        topic_name = t.name if t else None

    return RevisionResponse(
        id=item.id,
        title=item.title,
        topic_id=item.topic_id,
        topic_name=topic_name,
        scheduled_date=item.scheduled_date,
        completed=item.completed,
        notes=item.notes,
        created_at=item.created_at,
    )


@router.patch("/revisions/{revision_id}/complete", response_model=RevisionResponse)
async def complete_revision(
    revision_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RevisionItem)
        .options(selectinload(RevisionItem.topic))
        .where(
            RevisionItem.id == revision_id,
            RevisionItem.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Revision not found")
    item.completed = True
    if item.topic:
        item.topic.practice_count += 1
        item.topic.mastery_score = min(100, item.topic.mastery_score + 8)
    await db.flush()
    return RevisionResponse(
        id=item.id,
        title=item.title,
        topic_id=item.topic_id,
        topic_name=item.topic.name if item.topic else None,
        scheduled_date=item.scheduled_date,
        completed=item.completed,
        notes=item.notes,
        created_at=item.created_at,
    )


@router.get("/memory", response_model=list[MemoryResponse])
async def list_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LearningMemory)
        .where(LearningMemory.user_id == current_user.id)
        .order_by(LearningMemory.created_at.desc())
        .limit(50)
    )
    return [MemoryResponse.model_validate(m) for m in result.scalars().all()]


@router.post("/memory", response_model=MemoryResponse, status_code=201)
async def add_memory(
    data: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    memory = LearningMemory(
        user_id=current_user.id,
        content=data.content.strip(),
        source="user",
    )
    db.add(memory)
    await db.flush()
    await db.refresh(memory)
    return MemoryResponse.model_validate(memory)


@router.delete("/memory/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LearningMemory).where(
            LearningMemory.id == memory_id,
            LearningMemory.user_id == current_user.id,
        )
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    await db.delete(memory)
