from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event, EventSession
from app.models.registration import Registration
from app.models.user import User
from app.schemas.registration import RegistrationDetailOut, RegistrationOut

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
            event_title=ev.title if ev else None,
            event_image=ev.image_url if ev else None,
            session_name=sess.session_name,
            date=sess.date,
            location=sess.location,
        ))
    return out
