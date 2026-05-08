from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import exists, or_, func, select
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
    tab: str | None = Query(None),
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
    if tab:
        if tab == "free":
            filters.append(Event.registration_fee.in_(["免費", "Free"]))
        elif tab == "food":
            filters.append(
                exists(
                    select(EventSession.id)
                    .where(
                        EventSession.event_id == Event.id,
                        EventSession.meal.in_(
                            [
                                "提供用餐",
                                "Meal Provided",
                                "葷食",
                                "Non-Vegetarian Meal",
                                "素食(植物性餐食)",
                                "Vegetarian Meal",
                            ]
                        ),
                    )
                )
            )
        elif tab == "job":
            job_like = "%徵才%"
            job_like_en = "%job%"
            filters.append(
                or_(
                    Event.title.ilike(job_like),
                    Event.content.ilike(job_like),
                    Event.title.ilike(job_like_en),
                    Event.content.ilike(job_like_en),
                    Event.title.ilike("%career%"),
                    Event.content.ilike("%career%"),
                    Event.title.ilike("%recruit%"),
                    Event.content.ilike("%recruit%"),
                )
            )
        elif tab == "english":
            filters.append(
                or_(
                    Event.title.ilike("%英文%"),
                    Event.content.ilike("%英文%"),
                    Event.title.ilike("%English%"),
                    Event.content.ilike("%English%"),
                    Event.learning_category.ilike("%English%"),
                )
            )

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
