from datetime import datetime
from pydantic import BaseModel
from backend.app.schemas.user import UserOut

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: str
    task_id: str
    user_id: str
    content: str
    created_at: datetime
    user: UserOut

    class Config:
        from_attributes = True
