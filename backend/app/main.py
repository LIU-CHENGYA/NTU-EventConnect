from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth as auth_router
from app.api import events as events_router
from app.api import posts as posts_router
from app.api import comments as comments_router
from app.api import bookmarks as bookmarks_router
from app.api import registrations as registrations_router
from app.api import users as users_router
from app.api import uploads as uploads_router
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.config import settings
from app.db.session import Base, engine
from app import models  # noqa: F401  ensure models are imported before create_all

app = FastAPI(title="NTU EventConnect API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router.router)
app.include_router(events_router.router)
app.include_router(posts_router.router)
app.include_router(comments_router.router)
app.include_router(bookmarks_router.router)
app.include_router(registrations_router.router)
app.include_router(users_router.router)
app.include_router(uploads_router.router)

_uploads = Path("uploads")
_uploads.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_uploads)), name="uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
