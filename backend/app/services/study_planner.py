import json
import uuid
from datetime import date, timedelta

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.config import get_settings
from app.models.progress import UserTopic
from app.services.analytics import is_weak_topic

settings = get_settings()

STUDY_PLAN_PROMPT = """You are a study planner for students. Create a practical weekly study plan as JSON only.

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "description": "string (1-2 sentences)",
  "weekly_hours": number,
  "focus_areas": ["topic1", "topic2"],
  "tasks": [
    {
      "id": "unique-string-id",
      "title": "specific task",
      "topic": "topic name",
      "duration_minutes": 30,
      "due_date": "YYYY-MM-DD",
      "completed": false
    }
  ]
}

Rules:
- 5-8 tasks spread across the next 7 days
- Prioritize weak topics provided
- Mix revision, practice, and new learning
- Realistic durations (20-60 min per task)
- due_date must be within next 7 days from {start_date}

Student context:
- Learning goal: {goal}
- Weekly hours available: {weekly_hours}
- Weak topics: {weak_topics}
- All topics: {all_topics}
- Extra focus request: {focus}
"""


async def generate_study_plan(
    weak_topics: list[UserTopic],
    all_topics: list[UserTopic],
    learning_goal: str | None,
    weekly_hours: int,
    focus: str | None,
) -> dict:
    if not settings.gemini_api_key:
        return _fallback_plan(weak_topics, weekly_hours)

    weak_names = [t.name for t in weak_topics] or ["General revision"]
    all_names = [t.name for t in all_topics] or weak_names
    start = date.today().isoformat()

    prompt = STUDY_PLAN_PROMPT.format(
        start_date=start,
        goal=learning_goal or "Improve overall understanding",
        weekly_hours=weekly_hours,
        weak_topics=", ".join(weak_names),
        all_topics=", ".join(all_names),
        focus=focus or "Balanced improvement",
    )

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(model_name=settings.gemini_model)

    try:
        response = await model.generate_content_async(
            prompt,
            generation_config=GenerationConfig(
                temperature=0.5,
                max_output_tokens=4096,
                response_mime_type="application/json",
            ),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)
        tasks = data.get("tasks", [])
        for i, task in enumerate(tasks):
            if "id" not in task:
                task["id"] = str(uuid.uuid4())
            task.setdefault("completed", False)
        return {
            "title": data.get("title", "My Study Plan"),
            "description": data.get("description", ""),
            "plan_data": {
                "tasks": tasks,
                "weekly_hours": data.get("weekly_hours", weekly_hours),
                "focus_areas": data.get("focus_areas", weak_names),
            },
        }
    except Exception:
        return _fallback_plan(weak_topics, weekly_hours)


def _fallback_plan(weak_topics: list[UserTopic], weekly_hours: int) -> dict:
    topics = [t.name for t in weak_topics] or ["Core concepts", "Practice problems"]
    tasks = []
    for i in range(5):
        d = date.today() + timedelta(days=i + 1)
        tasks.append(
            {
                "id": str(uuid.uuid4()),
                "title": f"Study {topics[i % len(topics)]}",
                "topic": topics[i % len(topics)],
                "duration_minutes": 30,
                "due_date": d.isoformat(),
                "completed": False,
            }
        )
    return {
        "title": "Weekly Study Plan",
        "description": "Auto-generated plan based on your weak topics.",
        "plan_data": {
            "tasks": tasks,
            "weekly_hours": weekly_hours,
            "focus_areas": topics[:3],
        },
    }
