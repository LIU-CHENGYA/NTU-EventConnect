from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, selectinload
from app.models.post import EventBookmark

from app.db.session import get_db
from app.models.event import Event, EventSession, EventTag
from app.schemas.event import (
    EventDetailOut,
    EventListResponse,
    EventOut,
    EventSessionOut,
    TagOut,
)

router = APIRouter(prefix="/api/events", tags=["events"])


def _to_detail(e: Event) -> EventDetailOut:
    base = EventOut.model_validate(e).model_dump()
    base["tags"] = [t.tag for t in (e.tags or [])]
    return EventDetailOut(
        **base,
        sessions=[EventSessionOut.model_validate(s) for s in e.sessions],
    )


@router.get("", response_model=EventListResponse)
def list_events(
    category: str | None = Query(None),
    tag: str | None = Query(None),
    keyword: str | None = Query(None),
    sort: str = Query("id", pattern="^(id|hot)$"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    filters = []
    if category and category != "全部":
        # Category is a finite taxonomy — exact match keeps semantics tight.
        filters.append(Event.category == category)
    if keyword:
        # 模糊比對且不限大小寫 — works for ASCII (English keywords) and
        # passes through for CJK where case is moot.
        kw = keyword.lower()
        like = f"%{kw}%"
        filters.append(
            or_(
                func.lower(Event.title).like(like),
                func.lower(func.coalesce(Event.content, "")).like(like),
            )
        )
    if tag:
        # Tag list comes from a finite seed; exact match by design.
        tagged = db.query(EventTag.event_id).filter(EventTag.tag == tag).subquery()
        filters.append(Event.id.in_(tagged))

    total = (
        db.query(func.count(Event.id)).filter(*filters).scalar() or 0
    )

    q = (
        db.query(Event)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(*filters)
    )
    if sort == "hot":
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
            .order_by(hot_sub.c.bookmark_count.desc().nulls_last(), Event.id.desc())
        )
    else:
        q = q.order_by(Event.id)

    items = q.offset((page - 1) * size).limit(size).all()
    return EventListResponse(
        items=[_to_detail(e) for e in items],
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


@router.get("/tags", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db)):
    rows = (
        db.query(EventTag.tag, func.count(EventTag.event_id).label("count"))
        .group_by(EventTag.tag)
        .order_by(func.count(EventTag.event_id).desc())
        .all()
    )
    return [TagOut(name=name, count=count) for name, count in rows]


@router.get("/{event_id}", response_model=EventDetailOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = (
        db.query(Event)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _to_detail(event)


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
