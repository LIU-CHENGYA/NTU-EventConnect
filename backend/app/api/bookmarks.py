from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event
from app.models.post import EventBookmark, Post, PostBookmark
from app.models.user import User
from app.schemas.event import EventDetailOut, EventOut, EventSessionOut
from app.schemas.post import PostOut
from sqlalchemy.orm import selectinload
from app.api.posts import _post_out

router = APIRouter(tags=["bookmarks"])


@router.post("/api/events/{event_id}/bookmark", status_code=204)
def bookmark_event(
    event_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if not db.get(Event, event_id):
        raise HTTPException(404, "Event not found")
    exists = db.query(EventBookmark).filter(
        EventBookmark.event_id == event_id, EventBookmark.user_id == current.id
    ).first()
    if not exists:
        db.add(EventBookmark(event_id=event_id, user_id=current.id))
        db.commit()


@router.delete("/api/events/{event_id}/bookmark", status_code=204)
def unbookmark_event(
    event_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    db.query(EventBookmark).filter(
        EventBookmark.event_id == event_id, EventBookmark.user_id == current.id
    ).delete()
    db.commit()


@router.get("/api/users/me/bookmarks/events", response_model=list[EventDetailOut])
def my_event_bookmarks(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rows = (
        db.query(Event)
        .options(selectinload(Event.sessions))
        .join(EventBookmark, EventBookmark.event_id == Event.id)
        .filter(EventBookmark.user_id == current.id)
        .order_by(EventBookmark.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return [
        EventDetailOut(
            **EventOut.model_validate(e).model_dump(),
            sessions=[EventSessionOut.model_validate(s) for s in e.sessions],
        )
        for e in rows
    ]


@router.get("/api/users/me/bookmarks/posts", response_model=list[PostOut])
def my_post_bookmarks(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rows = (
        db.query(Post)
        .options(selectinload(Post.user))
        .join(PostBookmark, PostBookmark.post_id == Post.id)
        .filter(PostBookmark.user_id == current.id)
        .order_by(PostBookmark.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return [_post_out(p) for p in rows]


@router.get("/api/users/me/drafts", response_model=list[PostOut])
def my_drafts(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rows = (
        db.query(Post)
        .options(selectinload(Post.user))
        .filter(Post.user_id == current.id, Post.visibility == "private")
        .order_by(Post.id.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return [_post_out(p) for p in rows]
