import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.services.ws_manager import manager
from backend.app.api.auth import router as auth_router
from backend.app.api.users import router as users_router
from backend.app.api.tasks import router as tasks_router
from backend.app.api.analytics import router as analytics_router

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SaaS Task Management API with JWT Auth, WebSockets, and Analytics",
    version="1.0.0"
)

# Configure CORS
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup Event: Automatically initialize Database Tables (excellent for zero-config run)
@app.on_event("startup")
async def on_startup():
    # Make sure uploads directories exist if filesystem is writable
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIR, "avatars"), exist_ok=True)
        os.makedirs(os.path.join(settings.UPLOAD_DIR, "attachments"), exist_ok=True)
    except Exception:
        pass
    
    # Initialize db schema
    try:
        await init_db()
    except Exception as e:
        print("Database initialization note:", e)

# Serve Static Uploaded Files (avatars & attachments)
try:
    if os.path.exists(settings.UPLOAD_DIR):
        app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
except Exception:
    pass


# WebSocket Endpoint for real-time updates and notifications
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection alive, listen for heartbeat or client requests
            data = await websocket.receive_text()
            # Optional: handle custom websocket client actions
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# Include API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tasks_router)
app.include_router(analytics_router)

# Root route redirects to Swagger Documentation for immediate developer access
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")
