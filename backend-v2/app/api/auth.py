import logging
import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.group import GroupInvitation, GroupMember
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
)

log = logging.getLogger("uvicorn")
router = APIRouter(prefix="/api/auth", tags=["auth"])


def _claim_pending_invitations(db: Session, user: User) -> None:
    # When a user first signs up, any GroupInvitation rows targeting their
    # email (status="pending") were left dangling because _attach_member only
    # creates GroupMember when the invitee already exists at invite time.
    # Promote them now so the user can immediately see group posts that were
    # made while they were still a pending invitee.
    pendings = (
        db.query(GroupInvitation)
        .filter(GroupInvitation.email == user.email, GroupInvitation.status == "pending")
        .all()
    )
    for inv in pendings:
        existing = (
            db.query(GroupMember)
            .filter(GroupMember.group_id == inv.group_id, GroupMember.user_id == user.id)
            .first()
        )
        if not existing:
            db.add(GroupMember(group_id=inv.group_id, user_id=user.id))
        inv.status = "accepted"
    if pendings:
        db.commit()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _claim_pending_invitations(db, user)
    return TokenResponse(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(500, "Google login not configured")
    try:
        resp = httpx.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": payload.credential},
            timeout=10,
        )
    except httpx.HTTPError:
        raise HTTPException(401, "Failed to verify Google credential")
    if resp.status_code != 200:
        raise HTTPException(401, "Invalid Google credential")
    info = resp.json()
    if info.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(401, "Google credential audience mismatch")
    email = info.get("email")
    if not email or info.get("email_verified") not in (True, "true"):
        raise HTTPException(401, "Google email not verified")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash="",  # SSO user; password login disabled
            name="",  # filled later by client via PATCH /api/users/me
            avatar_url=info.get("picture"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        _claim_pending_invitations(db, user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserOut.model_validate(user),
        needs_username=not (user.name or "").strip(),
    )


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # SSO-only accounts have an empty password_hash — tell the user explicitly
    # so they know to click "以 Google 登入" instead.
    if user and (user.password_hash or "") == "":
        raise HTTPException(400, "sso_account")
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        try:
            from app.core.email import send_reset_email
            send_reset_email(user.email, token)
        except Exception as e:
            log.error("[forgot-password] Failed to send reset email to %s: %s", user.email, e)
    # Non-existent emails return the same 200 to avoid enumeration.
    return {"message": "如果此 Email 已註冊，重設連結已寄出"}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == payload.token).first()
    now = datetime.now(timezone.utc)
    if not user or not user.reset_token_expires or user.reset_token_expires.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Token 無效或已過期")
    # Prevent resetting password for SSO-only accounts. If a user was created
    # via Google SSO their `password_hash` is empty and password login is
    # intentionally disabled.
    if (user.password_hash or "") == "":
        raise HTTPException(status_code=400, detail="此帳號由第三方登入建立，無法從此路徑重設密碼")

    user.password_hash = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"message": "密碼已重設，請重新登入"}
