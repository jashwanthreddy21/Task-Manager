from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from backend.app.schemas.user import UserOut
from backend.app.schemas.comment import CommentOut

class TagOut(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class AttachmentOut(BaseModel):
    id: str
    task_id: str
    file_name: str
    file_path: str
    file_size: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class ActivityOut(BaseModel):
    id: str
    task_id: str
    user_id: str
    action: str
    created_at: datetime
    user: UserOut

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "Medium"  # "Low" | "Medium" | "High"
    status: str = "Incomplete"  # "Incomplete" | "Progress" | "Complete"
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None

class TaskStatusPatch(BaseModel):
    status: str

class TaskOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tags: List[TagOut] = []
    attachments: List[AttachmentOut] = []
    comments: List[CommentOut] = []
    activities: List[ActivityOut] = []

    class Config:
        from_attributes = True
