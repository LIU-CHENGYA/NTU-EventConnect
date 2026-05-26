from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.post import Comment
from app.models.user import User

router = APIRouter(prefix="/api/comments", tags=["comments"])


class CommentUpdateIn(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    user_id: int
    post_id: int

    class Config:
        from_attributes = True


@router.patch("/{comment_id}", response_model=CommentOut)
def update_comment(
    comment_id: int,
    body: CommentUpdateIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    c = db.get(Comment, comment_id)
    if not c:
        raise HTTPException(404, "Comment not found")
    if c.user_id != current.id:
        raise HTTPException(403, "Not your comment")
    c.content = body.content
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    c = db.get(Comment, comment_id)
    if not c:
        raise HTTPException(404, "Comment not found")
    if c.user_id != current.id:
        raise HTTPException(403, "Not your comment")
    db.delete(c)
    db.commit()
