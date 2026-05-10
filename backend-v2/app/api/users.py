from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event
from app.models.post import Comment, Post
from app.models.registration import Registration
from app.models.user import User
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
        .filter(Comment.user_id == current.id)
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
                post_event_title=e.title if e else None,
            )
        )
    return out


@router.get("/{user_id}", response_model=UserProfileOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    post_count = db.query(Post).filter(
        Post.user_id == user_id, Post.visibility == "public"
    ).count()
    joined = db.query(Registration).filter(
        Registration.user_id == user_id, Registration.status == "success"
    ).count()
    return UserProfileOut(
        **UserOut.model_validate(user).model_dump(),
        post_count=post_count,
        joined_event_count=joined,
    )
