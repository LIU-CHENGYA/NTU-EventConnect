from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, selectinload
from app.models.post import EventBookmark

from app.db.session import get_db
from app.models.event import Event, EventSession
from app.schemas.event import (
    EventDetailOut,
    EventListResponse,
    EventOut,
    EventSessionOut,
)

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=EventListResponse)
def list_events(
    category: str | None = Query(None),
    keyword: str | None = Query(None),
    sort: str = Query("id", pattern="^(id|hot)$"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    filters = []
    if category and category != "全部":
        filters.append(Event.category == category)
    if keyword:
        like = f"%{keyword}%"
        filters.append(or_(Event.title.like(like), Event.content.like(like)))

    total = (
        db.query(func.count(Event.id)).filter(*filters).scalar() or 0
    )

    q = (
        db.query(Event)
        .options(selectinload(Event.sessions))
        .filter(*filters)
    )
    if sort == "hot":
        # 算每個 event 的收藏總數
        hot_sub = (
            db.query(
                EventBookmark.event_id.label("event_id"),
                func.count(EventBookmark.user_id).label("bookmark_count"),
            )
            .group_by(EventBookmark.event_id)
            .subquery()
        )
        q = (
            q.outerjoin(hot_sub, hot_sub.c.event_id == Event.id)
            # 按收藏數倒序排，多的在前面；沒人收藏的排最後
            .order_by(hot_sub.c.bookmark_count.desc().nulls_last(), Event.id.desc())
        )
    else:
        q = q.order_by(Event.id)

    items = q.offset((page - 1) * size).limit(size).all()
    return EventListResponse(
        items=[
            EventDetailOut(
                **EventOut.model_validate(e).model_dump(),
                sessions=[EventSessionOut.model_validate(s) for s in e.sessions],
            )
            for e in items
        ],
        total=total,
        page=page,
        size=size,
    )


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(Event.category, func.count(Event.id).label("count"))
        .filter(Event.category.isnot(None))
        .group_by(Event.category)
        .order_by(func.count(Event.id).desc())
        .all()
    )
    return [{"name": name, "count": count} for name, count in rows]


@router.get("/{event_id}", response_model=EventDetailOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = (
        db.query(Event)
        .options(selectinload(Event.sessions))
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventDetailOut(
        **EventOut.model_validate(event).model_dump(),
        sessions=[EventSessionOut.model_validate(s) for s in event.sessions],
    )


@router.get("/{event_id}/sessions/{session_id}", response_model=EventSessionOut)
def get_session(event_id: int, session_id: int, db: Session = Depends(get_db)):
    sess = (
        db.query(EventSession)
        .filter(EventSession.id == session_id, EventSession.event_id == event_id)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess
