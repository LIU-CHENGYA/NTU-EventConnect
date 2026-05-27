import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, selectinload
from app.models.post import EventBookmark

from app.core.admin import is_admin_email
from app.core.cache import ttl_cache
from app.core.deps import get_current_user
from app.db.session import get_db, SessionLocal
from app.models.event import Event, EventSession, EventTag
from app.models.user import User
from app.schemas.event import (
    EventCreateIn,
    EventDetailOut,
    EventListResponse,
    EventOut,
    EventSessionOut,
    EventUpdateIn,
    TagOut,
)

router = APIRouter(prefix="/api/events", tags=["events"])


def _pick(en_value, zh_value):
    """Return EN value when truthy, else fall back to ZH."""
    return en_value if en_value else zh_value


def _event_payload(e: Event, lang: str) -> dict:
    """Build dict for EventOut respecting `lang`. EN falls back to ZH."""
    if lang == "en":
        return {
            "id": e.id,
            "title": _pick(e.title_en, e.title),
            "content": _pick(e.content_en, e.content),
            "category": _pick(e.category_en, e.category),
            "official_category": _pick(e.official_category_en, e.official_category),
            "image_url": e.image_url,
            "organizer": _pick(e.organizer_en, e.organizer),
            "contact_phone": e.contact_phone,
            "contact_email": e.contact_email,
            "registration_type": _pick(e.registration_type_en, e.registration_type),
            "registration_fee": _pick(e.registration_fee_en, e.registration_fee),
            "target_audience": _pick(e.target_audience_en, e.target_audience),
            "learning_category": _pick(e.learning_category_en, e.learning_category),
            "tags": e.tags or [],
        }
    return EventOut.model_validate(e).model_dump()


def _session_payload(s: EventSession, lang: str) -> dict:
    if lang == "en":
        return {
            "id": s.id,
            "event_id": s.event_id,
            "session_name": _pick(s.session_name_en, s.session_name),
            "session_content": _pick(s.session_content_en, s.session_content),
            "instructor": _pick(s.instructor_en, s.instructor),
            "location": _pick(s.location_en, s.location),
            "date": s.date,
            "time_range": s.time_range,
            "registration_start": s.registration_start,
            "registration_end": s.registration_end,
            "capacity": s.capacity,
            "remaining_slots": s.remaining_slots,
            "meal": _pick(s.meal_en, s.meal),
            "civil_servant_hours": s.civil_servant_hours,
            "study_hours": s.study_hours,
        }
    return EventSessionOut.model_validate(s).model_dump()


def _to_detail(e: Event, lang: str = "zh") -> EventDetailOut:
    return EventDetailOut(
        **_event_payload(e, lang),
        sessions=[EventSessionOut(**_session_payload(s, lang)) for s in (e.sessions or [])],
    )


@router.get("", response_model=EventListResponse)
def list_events(
    category: str | None = Query(None),
    tag: str | None = Query(None),
    tags: str | None = Query(None, description="Comma-separated tag list; events matching ANY of these tags"),
    keyword: str | None = Query(None),
    date: str | None = Query(None, description="YYYY-MM-DD; events with any session on or after this date"),
    date_to: str | None = Query(None, description="YYYY-MM-DD upper bound; events with session on or before this date"),
    location: str | None = Query(None, description="Filter by session location (case-insensitive contains)"),
    sort: str = Query("id", pattern="^(id|hot)$"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    lang: str = Query("zh", pattern="^(zh|en)$"),
    db: Session = Depends(get_db),
):
    filters = []
    if category and category != "全部":
        # `category` = 母活動名 (Event.official_category = activity_name_activity_session,
        # info.md L30 + Figma). Match equally against Event.title because old DBs
        # may not have the column populated yet; both store the parent name.
        # Event.category (= activity_type 講座/工作坊...) is kept in the OR for
        # backward compatibility with legacy seed/test fixtures.
        # In EN mode also match against the EN counterparts so users can pick
        # localized chips.
        cat_filters = [
            Event.official_category == category,
            Event.title == category,
            Event.category == category,
        ]
        if lang == "en":
            cat_filters.extend([
                Event.official_category_en == category,
                Event.title_en == category,
                Event.category_en == category,
            ])
        filters.append(or_(*cat_filters))
    if keyword:
        # 模糊比對且不限大小寫 — works for ASCII (English keywords) and
        # passes through for CJK where case is moot.
        kw = keyword.lower()
        like = f"%{kw}%"
        # Always search both ZH and EN content so EN-mode users can find ZH
        # events typed in either language and vice versa.
        filters.append(
            or_(
                func.lower(Event.title).like(like),
                func.lower(func.coalesce(Event.content, "")).like(like),
                func.lower(func.coalesce(Event.title_en, "")).like(like),
                func.lower(func.coalesce(Event.content_en, "")).like(like),
            )
        )
    if tag:
        # Tag list comes from a finite seed; exact match by design.
        tagged = db.query(EventTag.event_id).filter(EventTag.tag == tag).subquery()
        filters.append(Event.id.in_(tagged))
    if tags:
        # Multi-tag AND filter: events must have ALL of the listed tags.
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            multi_tagged = (
                db.query(EventTag.event_id)
                .filter(EventTag.tag.in_(tag_list))
                .group_by(EventTag.event_id)
                .having(func.count(EventTag.event_id) >= len(tag_list))
                .subquery()
            )
            filters.append(Event.id.in_(multi_tagged))
    if date or date_to:
        # Find events with at least one session that falls within [date, date_to].
        # Using a single subquery ensures the same session satisfies both bounds.
        session_q = db.query(EventSession.event_id).filter(EventSession.date.isnot(None))
        if date:
            session_q = session_q.filter(EventSession.date >= date)
        if date_to:
            session_q = session_q.filter(EventSession.date <= date_to)
        filters.append(Event.id.in_(session_q.subquery()))
    if location:
        # Case-insensitive location contains filter across sessions.
        loc_like = f"%{location.lower()}%"
        with_location = (
            db.query(EventSession.event_id)
            .filter(
                EventSession.location.isnot(None),
                func.lower(EventSession.location).like(loc_like),
            )
            .subquery()
        )
        filters.append(Event.id.in_(with_location))

    total = (
        db.query(func.count(Event.id)).filter(*filters).scalar() or 0
    )

    q = (
        db.query(Event)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(*filters)
    )
    if sort == "hot":
        # Restrict aggregation to the already-filtered event set so the DB
        # doesn't aggregate the entire table before joining (same pattern as posts hot sort).
        filtered_event_ids = db.query(Event.id).filter(*filters).subquery()
        hot_sub = (
            db.query(
                EventBookmark.event_id.label("event_id"),
                func.count(EventBookmark.user_id).label("bookmark_count"),
            )
            .filter(EventBookmark.event_id.in_(filtered_event_ids))
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
        items=[_to_detail(e, lang) for e in items],
        total=total,
        page=page,
        size=size,
    )


@ttl_cache(seconds=600)
def _categories_cached(lang: str) -> list[dict]:
    db: Session = SessionLocal()
    try:
        if lang == "en":
            name_expr = func.coalesce(
                Event.official_category_en,
                Event.title_en,
                Event.official_category,
                Event.title,
            ).label("name")
        else:
            name_expr = func.coalesce(Event.official_category, Event.title).label("name")
        rows = (
            db.query(name_expr, func.count(EventSession.id).label("count"))
            .outerjoin(EventSession, EventSession.event_id == Event.id)
            .filter(name_expr.isnot(None))
            .group_by(name_expr)
            .order_by(func.count(EventSession.id).desc(), name_expr.asc())
            .all()
        )
        return [{"name": name, "count": count} for name, count in rows]
    finally:
        db.close()


@ttl_cache(seconds=600)
def _tags_cached() -> list[dict]:
    db: Session = SessionLocal()
    try:
        rows = (
            db.query(EventTag.tag, func.count(EventTag.event_id).label("count"))
            .group_by(EventTag.tag)
            .order_by(func.count(EventTag.event_id).desc())
            .all()
        )
        return [{"name": name, "count": count} for name, count in rows]
    finally:
        db.close()


@router.get("/categories")
def list_categories(
    lang: str = Query("zh", pattern="^(zh|en)$"),
    db: Session = Depends(get_db),
):
    return _categories_cached(lang)


@router.get("/tags", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db)):
    return _tags_cached()


@router.get("/managed", response_model=EventListResponse)
def managed_events(
    page: int = Query(1, ge=1),
    size: int = Query(20),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Events the current admin manages (the events they created)."""
    # Management is admin-only (admin_whitelist.txt); the query below further
    # restricts to events this admin created.
    if not is_admin_email(current.email):
        raise HTTPException(403, "Admin only")
    total = (
        db.query(func.count(Event.id))
        .filter(Event.created_by_user_id == current.id)
        .scalar() or 0
    )
    items = (
        db.query(Event)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(Event.created_by_user_id == current.id)
        .order_by(Event.id.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return EventListResponse(
        items=[_to_detail(e, "zh") for e in items],
        total=total,
        page=page,
        size=size,
    )


@router.post("", response_model=EventDetailOut, status_code=201)
def create_event(
    payload: EventCreateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # Only whitelisted admins may create events (admin_whitelist.txt). The
    # creator becomes the event's manager; editing it and viewing its
    # registrations are then gated by ownership (see update_event /
    # event_registrations), which — since only admins can create — stays
    # admin-only.
    if not is_admin_email(current.email):
        raise HTTPException(403, "Admin only")

    # Generate a unique source_url for admin-created events (not scraped from NTU).
    admin_source_url = f"admin://{uuid.uuid4()}"

    event = Event(
        source_url=admin_source_url,
        title=payload.title,
        content=payload.content,
        category=payload.category,
        organizer=payload.organizer,
        image_url=payload.image_url,
        created_by_user_id=current.id,
    )
    db.add(event)
    db.flush()  # get event.id before inserting tags/sessions

    for tag_name in payload.tags:
        db.add(EventTag(event_id=event.id, tag=tag_name))

    for s in payload.sessions:
        session_source_url = f"admin://{uuid.uuid4()}"
        db.add(EventSession(
            event_id=event.id,
            source_url=session_source_url,
            session_name=s.session_name,
            date=s.date,
            time_range=s.time_range,
            location=s.location,
            capacity=s.capacity,
            remaining_slots=s.capacity,
        ))

    db.commit()
    db.refresh(event)

    # Reload with relationships.
    event = (
        db.query(Event)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(Event.id == event.id)
        .first()
    )
    return _to_detail(event, "zh")


@router.patch("/{event_id}", response_model=EventDetailOut)
def update_event(
    event_id: int,
    payload: EventUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    # Editing is admin-only (admin_whitelist.txt); ownership is enforced below
    # so a legacy non-admin owner can no longer edit events they created.
    if not is_admin_email(current.email):
        raise HTTPException(403, "Admin only")
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    # Only the event's creator (its manager) may edit it.
    if event.created_by_user_id != current.id:
        raise HTTPException(403, "Not your event")

    # Apply scalar fields only when explicitly provided.
    scalar_fields = {"title", "content", "category", "organizer", "image_url"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field in scalar_fields:
            setattr(event, field, value)

    # Replace all tags when `tags` is provided.
    if payload.tags is not None:
        db.query(EventTag).filter(EventTag.event_id == event_id).delete(
            synchronize_session=False
        )
        for tag_name in payload.tags:
            db.add(EventTag(event_id=event_id, tag=tag_name))

    # Upsert sessions when `sessions` is provided; unlisted sessions are untouched.
    if payload.sessions is not None:
        for s in payload.sessions:
            if s.id is not None:
                # Update existing session that belongs to this event.
                existing_sess = (
                    db.query(EventSession)
                    .filter(EventSession.id == s.id, EventSession.event_id == event_id)
                    .first()
                )
                if not existing_sess:
                    raise HTTPException(
                        404, f"Session {s.id} not found for event {event_id}"
                    )
                sess_fields = s.model_dump(exclude_unset=True)
                sess_fields.pop("id", None)
                for field, value in sess_fields.items():
                    if field == "capacity":
                        # Adjust remaining_slots by the capacity delta, clamped to >= 0.
                        old_capacity = existing_sess.capacity
                        delta = value - old_capacity
                        new_remaining = max(0, existing_sess.remaining_slots + delta)
                        existing_sess.remaining_slots = new_remaining
                    setattr(existing_sess, field, value)
            else:
                # Insert new session.
                session_source_url = f"admin://{uuid.uuid4()}"
                new_capacity = s.capacity if s.capacity is not None else 0
                db.add(EventSession(
                    event_id=event_id,
                    source_url=session_source_url,
                    session_name=s.session_name,
                    date=s.date,
                    time_range=s.time_range,
                    location=s.location,
                    capacity=new_capacity,
                    remaining_slots=new_capacity,
                ))

    db.commit()

    # Reload with relationships.
    event = (
        db.query(Event)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(Event.id == event_id)
        .first()
    )
    return _to_detail(event, "zh")


@router.get("/{event_id}", response_model=EventDetailOut)
def get_event(
    event_id: int,
    lang: str = Query("zh", pattern="^(zh|en)$"),
    db: Session = Depends(get_db),
):
    event = (
        db.query(Event)
        .options(selectinload(Event.sessions), selectinload(Event.tags))
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _to_detail(event, lang)


@router.get("/{event_id}/sessions/{session_id}", response_model=EventSessionOut)
def get_session(
    event_id: int,
    session_id: int,
    lang: str = Query("zh", pattern="^(zh|en)$"),
    db: Session = Depends(get_db),
):
    sess = (
        db.query(EventSession)
        .filter(EventSession.id == session_id, EventSession.event_id == event_id)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return EventSessionOut(**_session_payload(sess, lang))
