from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.admin import is_admin_email
from app.core.deps import get_current_user
from app.core.time import session_has_ended
from app.db.session import get_db
from app.models.event import Event, EventSession
from app.models.registration import Registration
from app.models.user import User
from app.schemas.registration import EventRegistrationOut, RegistrationDetailOut, RegistrationOut

router = APIRouter(tags=["registrations"])


@router.post(
    "/api/sessions/{session_id}/register",
    response_model=RegistrationOut,
    status_code=201,
)
def register_session(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    sess = db.get(EventSession, session_id)
    if not sess:
        raise HTTPException(404, "Session not found")
    if session_has_ended(sess):
        raise HTTPException(409, "Activity already ended; registration not allowed")
    if sess.registration_start:
        from datetime import date as _date
        try:
            if _date.today() < _date.fromisoformat(sess.registration_start):
                raise HTTPException(409, "Registration period has not started yet")
        except ValueError:
            pass

    existing = db.query(Registration).filter(
        Registration.user_id == current.id,
        Registration.session_id == session_id,
    ).first()
    if existing and existing.status != "cancelled":
        raise HTTPException(409, "Already registered")

    # Atomic decrement: works on SQLite/Postgres/MySQL without relying on
    # FOR UPDATE row locks. The WHERE remaining_slots > 0 guard ensures we
    # only ever take a slot if one is genuinely available — concurrent
    # callers either claim a distinct slot or get rowcount 0 and fall through
    # to the waitlist path.
    claimed = (
        db.query(EventSession)
        .filter(EventSession.id == session_id, EventSession.remaining_slots > 0)
        .update({EventSession.remaining_slots: EventSession.remaining_slots - 1},
                synchronize_session=False)
    )
    status_ = "success" if claimed == 1 else "waitlist"

    if existing:
        existing.status = status_
        reg = existing
    else:
        reg = Registration(user_id=current.id, session_id=session_id, status=status_)
        db.add(reg)

    db.commit()
    db.refresh(reg)
    return reg


@router.delete("/api/registrations/{reg_id}", status_code=200, response_model=RegistrationOut)
def cancel_registration(
    reg_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    reg = db.get(Registration, reg_id)
    if not reg:
        raise HTTPException(404, "Registration not found")
    if reg.user_id != current.id:
        raise HTTPException(403, "Not your registration")
    if reg.status == "cancelled":
        return reg

    sess = db.get(EventSession, reg.session_id)
    if sess and session_has_ended(sess):
        raise HTTPException(409, "Activity already ended; cancellation not allowed")
    if reg.status == "success" and sess:
        # Atomic increment to release the slot.
        db.query(EventSession).filter(EventSession.id == sess.id).update(
            {EventSession.remaining_slots: EventSession.remaining_slots + 1},
            synchronize_session=False,
        )
        db.refresh(sess)
        # promote first waitlist user (FIFO)
        next_wait = (
            db.query(Registration)
            .filter(
                Registration.session_id == sess.id,
                Registration.status == "waitlist",
            )
            .order_by(Registration.registered_at.asc(), Registration.id.asc())
            .first()
        )
        if next_wait:
            claimed = (
                db.query(EventSession)
                .filter(EventSession.id == sess.id, EventSession.remaining_slots > 0)
                .update(
                    {EventSession.remaining_slots: EventSession.remaining_slots - 1},
                    synchronize_session=False,
                )
            )
            if claimed == 1:
                next_wait.status = "success"

    reg.status = "cancelled"
    db.commit()
    db.refresh(reg)
    return reg


@router.get(
    "/api/users/me/registrations",
    response_model=list[RegistrationDetailOut],
)
def my_registrations(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    lang: str = Query("zh"),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    rows = (
        db.query(Registration, EventSession, Event)
        .join(EventSession, EventSession.id == Registration.session_id)
        .join(Event, Event.id == EventSession.event_id)
        .filter(Registration.user_id == current.id)
        .order_by(Registration.registered_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    out: list[RegistrationDetailOut] = []
    for reg, sess, ev in rows:
        out.append(RegistrationDetailOut(
            id=reg.id,
            user_id=reg.user_id,
            session_id=reg.session_id,
            status=reg.status,
            registered_at=reg.registered_at,
            event_id=ev.id if ev else None,
            event_title=(ev.title_en if lang == "en" and ev.title_en else ev.title) if ev else None,
            event_image=ev.image_url if ev else None,
            category=(ev.category_en if lang == "en" and ev.category_en else ev.category) if ev else None,
            official_category=(ev.official_category_en if lang == "en" and ev.official_category_en else ev.official_category) if ev else None,
            session_name=sess.session_name,
            date=sess.date,
            time=sess.time_range,
            location=sess.location,
        ))
    return out


@router.get(
    "/api/events/{event_id}/registrations",
    response_model=list[EventRegistrationOut],
)
def event_registrations(
    event_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """Return all registrations for every session of the given event.

    Admin-only (admin_whitelist.txt); the ownership check below further limits
    an admin to the registration lists of events they created.
    """
    if not is_admin_email(current.email):
        raise HTTPException(403, "Admin only")
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    if event.created_by_user_id != current.id:
        raise HTTPException(403, "Not your event")

    # Join Registration -> EventSession -> User; filter by event_id.
    rows = (
        db.query(Registration, EventSession, User)
        .join(EventSession, EventSession.id == Registration.session_id)
        .join(User, User.id == Registration.user_id)
        .filter(EventSession.event_id == event_id)
        .order_by(Registration.registered_at.desc())
        .all()
    )

    return [
        EventRegistrationOut(
            registration_id=reg.id,
            user_id=reg.user_id,
            user_name=user.name,
            user_email=user.email,
            student_id=user.student_id,
            department=user.department,
            session_id=reg.session_id,
            session_name=sess.session_name,
            status=reg.status,
            registered_at=reg.registered_at,
        )
        for reg, sess, user in rows
    ]
