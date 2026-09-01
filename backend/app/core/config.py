import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from a .env file if it exists
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "SaaS Task Manager")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-key-replace-in-production-a928c0b2d398f")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Database connection URL (defaults to local SQLite if POSTGRES is not provided)
    @property
    def DATABASE_URL(self) -> str:
        url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./tasks.db")
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:5173,http://localhost:3000,http://localhost:80,http://localhost"
    )

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
