from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event
from app.models.group import Group, GroupMember
from app.models.post import EventBookmark, Post, PostBookmark
from app.models.user import User
from app.schemas.event import EventDetailOut, EventOut, EventSessionOut
from app.schemas.post import PostOut
from app.api.posts import _post_out, _post_out_bulk

router = APIRouter(tags=["bookmarks"])


class BookmarkIn(BaseModel):
    session_id: int = 0  # 0 = whole-event; non-zero = specific session


def _event_bookmark_count(db: Session, event_id: int) -> int:
    return db.query(func.count(EventBookmark.event_id)).filter(EventBookmark.event_id == event_id).scalar() or 0


@router.post("/api/events/{event_id}/bookmark")
def bookmark_event(
    event_id: int,
    body: BookmarkIn = BookmarkIn(),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if not db.get(Event, event_id):
        raise HTTPException(404, "Event not found")
    try:
        db.add(EventBookmark(event_id=event_id, user_id=current.id, session_id=body.session_id))
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"bookmarked": True, "bookmark_count": _event_bookmark_count(db, event_id), "session_id": body.session_id}


@router.delete("/api/events/{event_id}/bookmark")
def unbookmark_event(
    event_id: int,
    session_id: int = Query(0),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    db.query(EventBookmark).filter(
        EventBookmark.event_id == event_id,
        EventBookmark.user_id == current.id,
        EventBookmark.session_id == session_id,
    ).delete()
    db.commit()
    return {"bookmarked": False, "bookmark_count": _event_bookmark_count(db, event_id), "session_id": session_id}


class EventBookmarkItem(BaseModel):
    bookmarked_session_id: int
    event: EventDetailOut

    class Config:
        from_attributes = True


@router.get("/api/users/me/bookmarks/events", response_model=list[EventBookmarkItem])
def my_event_bookmarks(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rows = (
        db.query(EventBookmark, Event)
        .join(Event, EventBookmark.event_id == Event.id)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(EventBookmark.user_id == current.id)
        .order_by(EventBookmark.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    result = []
    for bm, e in rows:
        event_detail = EventDetailOut(
            **EventOut.model_validate(e).model_dump(),
            sessions=[EventSessionOut.model_validate(s) for s in (e.sessions or [])],
        )
        result.append(EventBookmarkItem(bookmarked_session_id=bm.session_id, event=event_detail))
    return result


@router.get("/api/users/me/bookmarks/posts", response_model=list[PostOut])
def my_post_bookmarks(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # Push visibility check into SQL (same pattern as list_posts) so we avoid
    # calling _can_view per-row, which issued 2 DB queries per group post.
    member_groups = db.query(GroupMember.group_id).filter(GroupMember.user_id == current.id).subquery()
    owned_groups = db.query(Group.id).filter(Group.owner_id == current.id).subquery()
    rows = (
        db.query(Post)
        .options(selectinload(Post.user))
        .join(PostBookmark, PostBookmark.post_id == Post.id)
        .filter(
            PostBookmark.user_id == current.id,
            Post.is_draft == False,  # noqa: E712
            or_(
                Post.visibility == "public",
                and_(Post.visibility == "private", Post.user_id == current.id),
                and_(
                    Post.visibility == "group",
                    or_(Post.group_id.in_(member_groups), Post.group_id.in_(owned_groups)),
                ),
            ),
        )
        .order_by(PostBookmark.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return _post_out_bulk(db, rows, viewer=current)


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
        .filter(Post.user_id == current.id, Post.is_draft == True)  # noqa: E712
        .order_by(Post.id.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return _post_out_bulk(db, rows, viewer=current)
