from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from backend.app.core.config import settings

# Base class for SQLAlchemy declarative models
Base = declarative_base()

# Configure engine arguments
engine_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

# Create async database engine
engine = create_async_engine(settings.DATABASE_URL, **engine_args)

# Create sessionmaker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Dependency to get async DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Helper to automatically construct tables (great for immediate runs)
async def init_db():
    async with engine.begin() as conn:
        # Import all models before calling Base.metadata.create_all
        from backend.app.models.user import User
        from backend.app.models.task import Task
        from backend.app.models.tag import Tag, task_tag_association
        from backend.app.models.comment import Comment
        from backend.app.models.activity import Activity
        
        await conn.run_sync(Base.metadata.create_all)
