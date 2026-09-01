import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.tag import task_tag_association

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(50), default="Medium")  # "Low" | "Medium" | "High"
    status = Column(String(50), default="Incomplete")  # "Incomplete" | "Progress" | "Complete"
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tasks")
    tags = relationship("Tag", secondary=task_tag_association, lazy="selectin")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan", order_by="desc(Comment.created_at)")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="task", cascade="all, delete-orphan", order_by="desc(Activity.created_at)")
