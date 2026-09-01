import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import case, desc, asc, or_
from sqlalchemy.orm import selectinload

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.task import Task
from backend.app.models.tag import Tag
from backend.app.models.comment import Comment
from backend.app.models.attachment import Attachment
from backend.app.models.activity import Activity
from backend.app.services.ws_manager import manager
from backend.app.schemas.task import TaskOut, TaskCreate, TaskUpdate, TaskStatusPatch, AttachmentOut
from backend.app.schemas.comment import CommentCreate, CommentOut

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

# Helper function to record history activities
async def log_activity(db: AsyncSession, task_id: str, user_id: str, action: str):
    activity = Activity(task_id=task_id, user_id=user_id, action=action)
    db.add(activity)
    await db.flush() # Ensure it's populated for broad-casting

@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Process Tags
    tags_list = []
    if payload.tags:
        for tag_name in payload.tags:
            tag_name_clean = tag_name.strip()
            if not tag_name_clean:
                continue
            # Find or create Tag
            result = await db.execute(select(Tag).where(Tag.name == tag_name_clean))
            tag = result.scalar_one_or_none()
            if not tag:
                tag = Tag(name=tag_name_clean)
                db.add(tag)
                await db.flush() # Flush to populate ID
            tags_list.append(tag)

    # Create Task
    new_task = Task(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=payload.status,
        due_date=payload.due_date,
        tags=tags_list
    )
    
    db.add(new_task)
    await db.flush() # Flush to populate new_task.id
    
    # Log creation activity
    await log_activity(db, new_task.id, current_user.id, "created this task")
    
    await db.commit()
    
    # Retrieve fully-loaded task
    result = await db.execute(
        select(Task)
        .where(Task.id == new_task.id)
        .options(
            selectinload(Task.tags),
            selectinload(Task.attachments),
            selectinload(Task.comments).selectinload(Comment.user),
            selectinload(Task.activities).selectinload(Activity.user)
        )
    )
    task_loaded = result.scalar_one()
    
    # Broadcast notification to other WebSocket clients
    await manager.broadcast({
        "event": "task_created",
        "task_id": task_loaded.id,
        "title": task_loaded.title,
        "author": current_user.name
    })
    
    return task_loaded

@router.get("", response_model=List[TaskOut])
async def list_tasks(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "newest",  # newest, oldest, priority
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).where(Task.user_id == current_user.id)
    
    # Apply status and priority filters
    if status_filter:
        query = query.where(Task.status == status_filter)
    if priority_filter:
        query = query.where(Task.priority == priority_filter)
        
    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern)
            )
        )
        
    # Apply sorting
    if sort_by == "oldest":
        query = query.order_by(asc(Task.created_at))
    elif sort_by == "priority":
        # Custom sorting logic: High -> Medium -> Low
        priority_case = case(
            (Task.priority == "High", 1),
            (Task.priority == "Medium", 2),
            (Task.priority == "Low", 3),
            else_=4
        )
        query = query.order_by(asc(priority_case), desc(Task.created_at))
    else:  # newest
        query = query.order_by(desc(Task.created_at))
        
    # Eagerly load all relationships to prevent async fetching issues
    query = query.options(
        selectinload(Task.tags),
        selectinload(Task.attachments),
        selectinload(Task.comments).selectinload(Comment.user),
        selectinload(Task.activities).selectinload(Activity.user)
    )
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    return tasks

@router.get("/{task_id}", response_model=TaskOut)
async def get_task_details(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id, Task.user_id == current_user.id)
        .options(
            selectinload(Task.tags),
            selectinload(Task.attachments),
            selectinload(Task.comments).selectinload(Comment.user),
            selectinload(Task.activities).selectinload(Activity.user)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch task
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id, Task.user_id == current_user.id)
        .options(
            selectinload(Task.tags),
            selectinload(Task.attachments),
            selectinload(Task.comments).selectinload(Comment.user),
            selectinload(Task.activities).selectinload(Activity.user)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    # Audit changes for activity tracking
    activities = []
    
    if payload.title is not None and payload.title != task.title:
        activities.append(f"renamed task to '{payload.title}'")
        task.title = payload.title
        
    if payload.description is not None and payload.description != task.description:
        activities.append("updated the description")
        task.description = payload.description
        
    if payload.priority is not None and payload.priority != task.priority:
        activities.append(f"changed priority to {payload.priority}")
        task.priority = payload.priority
        
    if payload.status is not None and payload.status != task.status:
        activities.append(f"updated status to {payload.status}")
        task.status = payload.status
        
    if payload.due_date is not None:
        task.due_date = payload.due_date
        activities.append("updated due date")
        
    # Process updated tags
    if payload.tags is not None:
        new_tags = []
        for tag_name in payload.tags:
            tag_name_clean = tag_name.strip()
            if not tag_name_clean:
                continue
            result = await db.execute(select(Tag).where(Tag.name == tag_name_clean))
            tag = result.scalar_one_or_none()
            if not tag:
                tag = Tag(name=tag_name_clean)
                db.add(tag)
                await db.flush()
            new_tags.append(tag)
        task.tags = new_tags
        activities.append("updated tags")
        
    # Log updates
    for action in activities:
        await log_activity(db, task.id, current_user.id, action)
        
    task.updated_at = datetime.utcnow()
    db.add(task)
    await db.commit()
    
    # Reload fully
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(
            selectinload(Task.tags),
            selectinload(Task.attachments),
            selectinload(Task.comments).selectinload(Comment.user),
            selectinload(Task.activities).selectinload(Activity.user)
        )
    )
    task_loaded = result.scalar_one()
    
    # Broadcast notification to other WebSocket clients
    await manager.broadcast({
        "event": "task_updated",
        "task_id": task_loaded.id,
        "title": task_loaded.title,
        "author": current_user.name
    })
    
    return task_loaded

@router.patch("/{task_id}/status", response_model=TaskOut)
async def patch_task_status(
    task_id: str,
    payload: TaskStatusPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id, Task.user_id == current_user.id)
        .options(
            selectinload(Task.tags),
            selectinload(Task.attachments),
            selectinload(Task.comments).selectinload(Comment.user),
            selectinload(Task.activities).selectinload(Activity.user)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    old_status = task.status
    if payload.status != old_status:
        task.status = payload.status
        task.updated_at = datetime.utcnow()
        await log_activity(db, task.id, current_user.id, f"moved task from {old_status} to {payload.status}")
        db.add(task)
        await db.commit()
        
    # Reload fully
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(
            selectinload(Task.tags),
            selectinload(Task.attachments),
            selectinload(Task.comments).selectinload(Comment.user),
            selectinload(Task.activities).selectinload(Activity.user)
        )
    )
    task_loaded = result.scalar_one()
    
    # Broadcast notification to other WebSocket clients
    await manager.broadcast({
        "event": "task_status_changed",
        "task_id": task_loaded.id,
        "title": task_loaded.title,
        "status": task_loaded.status,
        "author": current_user.name
    })
    
    return task_loaded

@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id, Task.user_id == current_user.id)
        .options(selectinload(Task.attachments))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    # Clean up attachment files from disk
    for attachment in task.attachments:
        if attachment.file_path.startswith("/uploads"):
            path_to_delete = os.path.join(
                settings.UPLOAD_DIR,
                attachment.file_path.replace("/uploads/", "")
            )
            if os.path.exists(path_to_delete):
                try:
                    os.remove(path_to_delete)
                except Exception:
                    pass
                    
    # Broadcast delete action before removing task
    await manager.broadcast({
        "event": "task_deleted",
        "task_id": task.id,
        "title": task.title,
        "author": current_user.name
    })
    
    await db.delete(task)
    await db.commit()
    return {"message": "Task successfully deleted"}

# --- Comments ---
@router.post("/{task_id}/comments", response_model=CommentOut)
async def add_task_comment(
    task_id: str,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Confirm task exists
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    new_comment = Comment(
        task_id=task_id,
        user_id=current_user.id,
        content=payload.content
    )
    
    db.add(new_comment)
    await log_activity(db, task_id, current_user.id, f"added a comment: '{payload.content[:30]}...'")
    await db.commit()
    
    # Reload comment eagerly to output correct payload
    result = await db.execute(
        select(Comment)
        .where(Comment.id == new_comment.id)
        .options(selectinload(Comment.user))
    )
    comment_loaded = result.scalar_one()
    
    await manager.broadcast({
        "event": "comment_added",
        "task_id": task_id,
        "comment_id": comment_loaded.id,
        "author": current_user.name
    })
    
    return comment_loaded

# --- Attachments ---
@router.post("/{task_id}/attachments", response_model=AttachmentOut)
async def add_task_attachment(
    task_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Confirm task exists
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    # Check file size (e.g. max 10MB limit)
    MAX_SIZE = 10 * 1024 * 1024
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10MB"
        )
        
    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"task_{task_id}_{uuid.uuid4().hex}{file_extension}"
    
    attachments_dir = os.path.join(settings.UPLOAD_DIR, "attachments")
    os.makedirs(attachments_dir, exist_ok=True)
    
    file_path = os.path.join(attachments_dir, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save attachment: {str(e)}"
        )
        
    relative_path = f"/uploads/attachments/{unique_filename}"
    new_attachment = Attachment(
        task_id=task_id,
        file_name=file.filename,
        file_path=relative_path,
        file_size=file_size
    )
    
    db.add(new_attachment)
    await log_activity(db, task_id, current_user.id, f"uploaded attachment '{file.filename}'")
    await db.commit()
    await db.refresh(new_attachment)
    
    await manager.broadcast({
        "event": "attachment_uploaded",
        "task_id": task_id,
        "file_name": file.filename,
        "author": current_user.name
    })
    
    return new_attachment
