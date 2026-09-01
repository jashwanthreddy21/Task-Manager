from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.task import Task
from backend.app.models.activity import Activity

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("")
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Base query for the user's tasks
    base_query = select(Task).where(Task.user_id == current_user.id)
    
    # 1. Calculate Card Stats (Total, Incomplete, Progress, Complete)
    stats_query = select(
        func.count(Task.id).label("total"),
        func.count(case((Task.status == "Incomplete", 1))).label("incomplete"),
        func.count(case((Task.status == "Progress", 1))).label("progress"),
        func.count(case((Task.status == "Complete", 1))).label("complete")
    ).where(Task.user_id == current_user.id)
    
    stats_result = await db.execute(stats_query)
    stats = stats_result.fetchone()
    
    total = stats.total if stats else 0
    incomplete = stats.incomplete if stats else 0
    progress = stats.progress if stats else 0
    complete = stats.complete if stats else 0
    
    # 2. Status Distribution (for Pie/Donut Chart)
    status_distribution = [
        {"name": "Incomplete", "value": incomplete, "color": "#1E293B"},
        {"name": "In Progress", "value": progress, "color": "#F59E0B"},
        {"name": "Complete", "value": complete, "color": "#10B981"}
    ]
    
    # 3. Priority Distribution (for Bar Chart)
    priority_query = select(
        Task.priority, func.count(Task.id)
    ).where(Task.user_id == current_user.id).group_by(Task.priority)
    
    priority_result = await db.execute(priority_query)
    priority_rows = priority_result.all()
    priority_map = {row[0]: row[1] for row in priority_rows}
    
    priority_distribution = [
        {"name": "Low", "value": priority_map.get("Low", 0)},
        {"name": "Medium", "value": priority_map.get("Medium", 0)},
        {"name": "High", "value": priority_map.get("High", 0)}
    ]
    
    # 4. Weekly Productivity Chart: Count tasks completed each day for the last 7 days
    # Let's get the list of the last 7 days (including today)
    today = datetime.utcnow().date()
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    
    # Query tasks completed in the last 7 days
    # A task is completed if status == 'Complete' and updated_at is within the timeframe
    seven_days_ago = datetime.combine(today - timedelta(days=6), datetime.min.time())
    completed_query = select(
        func.date(Task.updated_at).label("completion_date"),
        func.count(Task.id).label("count")
    ).where(
        Task.user_id == current_user.id,
        Task.status == "Complete",
        Task.updated_at >= seven_days_ago
    ).group_by(func.date(Task.updated_at))
    
    completed_result = await db.execute(completed_query)
    completed_rows = completed_result.all()
    
    completed_map = {row[0]: row[1] for row in completed_rows}
    
    # Format database response date to string keys safely
    # SQLite/Postgres return string or date objects differently
    completed_map_str = {}
    for k, v in completed_map.items():
        if isinstance(k, str):
            # Parse 'YYYY-MM-DD' safely if string
            try:
                date_key = datetime.strptime(k.split(" ")[0], "%Y-%m-%d").date()
                completed_map_str[date_key] = v
            except Exception:
                pass
        else:
            completed_map_str[k] = v
            
    weekly_productivity = []
    for day in last_7_days:
        weekly_productivity.append({
            "date": day.strftime("%b %d"),
            "completed": completed_map_str.get(day, 0)
        })
        
    # 5. Activity Timeline: Get the last 10 activities of this user
    # We can join Task to get task title
    activity_query = select(Activity, Task.title).outerjoin(
        Task, Activity.task_id == Task.id
    ).where(Activity.user_id == current_user.id).order_by(Activity.created_at.desc()).limit(10)
    
    activity_result = await db.execute(activity_query)
    activity_rows = activity_result.all()
    
    recent_activities = []
    for act, task_title in activity_rows:
        recent_activities.append({
            "id": act.id,
            "task_id": act.task_id,
            "task_title": task_title or "Deleted Task",
            "action": act.action,
            "created_at": act.created_at.isoformat(),
            "user_name": current_user.name
        })

    return {
        "summary": {
            "total_tasks": total,
            "incomplete_tasks": incomplete,
            "in_progress_tasks": progress,
            "completed_tasks": complete
        },
        "status_distribution": status_distribution,
        "priority_distribution": priority_distribution,
        "weekly_productivity": weekly_productivity,
        "recent_activities": recent_activities
    }
