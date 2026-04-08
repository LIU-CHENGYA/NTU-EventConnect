from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event
from app.models.post import Post
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
