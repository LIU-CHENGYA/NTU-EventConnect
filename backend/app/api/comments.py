from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.post import Comment
from app.models.user import User

router = APIRouter(prefix="/api/comments", tags=["comments"])


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
