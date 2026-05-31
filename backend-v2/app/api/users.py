from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.admin import is_admin_email
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event, EventSession
from app.models.post import Comment, EventBookmark, Post
from app.models.registration import Registration
from app.models.user import User
from app.schemas.event import EventDetailOut, EventListResponse
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/users", tags=["users"])


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    bio: str | None = Field(None, max_length=500)
    avatar_url: str | None = None
    department: str | None = None
    student_id: str | None = None


class UserProfileOut(UserOut):
    model_config = ConfigDict(from_attributes=True)
    post_count: int = 0
    joined_event_count: int = 0
    upcoming_event_count: int = 0
    bookmarked_event_count: int = 0


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(current, k, v)
    db.commit()
    db.refresh(current)
    return current


class MyCommentOut(BaseModel):
    """A comment authored by the current user, with enough post context to link back."""

    id: int
    content: str
    created_at: datetime
    post_id: int
    post_title: str | None = None
    post_excerpt: str
    post_is_board_post: bool
    post_event_id: int | None = None
    post_event_title: str | None = None


@router.get("/me/comments", response_model=list[MyCommentOut])
def list_my_comments(
    lang: str = Query("zh"),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Return the current user's comments, newest first, with linked post info.

    The frontend renders this on the personal page so each comment can navigate
    to its source post (board post or event review thread).
    """
    rows = (
        db.query(Comment, Post, Event)
        .join(Post, Post.id == Comment.post_id)
        .outerjoin(Event, Event.id == Post.event_id)
        # Never surface metadata of a post that has since become a draft.
        .filter(Comment.user_id == current.id, Post.is_draft == False)  # noqa: E712
        .order_by(Comment.created_at.desc())
        .all()
    )
    out: list[MyCommentOut] = []
    for c, p, e in rows:
        out.append(
            MyCommentOut(
                id=c.id,
                content=c.content,
                created_at=c.created_at,
                post_id=p.id,
                post_title=p.title,
                post_excerpt=(p.content or "")[:80],
                post_is_board_post=bool(p.is_board_post),
                post_event_id=p.event_id,
                post_event_title=(e.title_en if lang == "en" and e.title_en else e.title) if e else None,
            )
        )
    return out


@router.get("/me/managed_events", response_model=EventListResponse)
def my_managed_events(
    page: int = Query(1, ge=1),
    size: int = Query(20),
    lang: str = Query("zh"),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """All admin-created events visible to any admin (admin-only)."""
    if not is_admin_email(current.email):
        raise HTTPException(403, "Admin only")
    from app.api.events import _to_detail
    total = (
        db.query(func.count(Event.id))
        .filter(Event.created_by_user_id.isnot(None))
        .scalar() or 0
    )
    items = (
        db.query(Event)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(Event.created_by_user_id.isnot(None))
        .order_by(Event.id.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return EventListResponse(
        items=[_to_detail(e, lang) for e in items],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{user_id}", response_model=UserProfileOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    post_count = db.query(Post).filter(
        Post.user_id == user_id, Post.visibility == "public", Post.is_draft == False  # noqa: E712
    ).count()
    joined = db.query(Registration).filter(
        Registration.user_id == user_id, Registration.status == "success"
    ).count()
    # Upcoming = successful registrations whose session date is today or later.
    # Session dates are stored as ISO "YYYY-MM-DD" strings, so a lexical
    # comparison against today is also chronological. Counting on the backend
    # avoids the frontend's paginated registration list undercounting the badge.
    today = datetime.now().strftime("%Y-%m-%d")
    upcoming = (
        db.query(Registration)
        .join(EventSession, EventSession.id == Registration.session_id)
        .filter(
            Registration.user_id == user_id,
            Registration.status == "success",
            EventSession.date >= today,
        )
        .count()
    )
    # Bookmarked = number of event bookmarks (one row per bookmarked session),
    # matching the "收藏活動" tab.
    bookmarked = db.query(EventBookmark).filter(
        EventBookmark.user_id == user_id
    ).count()
    return UserProfileOut(
        **UserOut.model_validate(user).model_dump(),
        post_count=post_count,
        joined_event_count=joined,
        upcoming_event_count=upcoming,
        bookmarked_event_count=bookmarked,
    )
