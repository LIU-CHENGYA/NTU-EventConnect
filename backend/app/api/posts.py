from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user, get_current_user_optional
from app.db.session import get_db
from app.models.post import Post, Comment, PostLike, PostBookmark
from app.models.user import User
from app.schemas.post import (
    CommentCreate, CommentOut, PostCreate, PostDetailOut, PostOut, PostUpdate,
)

router = APIRouter(prefix="/api/posts", tags=["posts"])


def _post_out(p: Post) -> PostOut:
    out = PostOut.model_validate(p)
    out.user_name = p.user.name if p.user else None
    return out


def _comment_out(c: Comment) -> CommentOut:
    out = CommentOut.model_validate(c)
    out.user_name = c.user.name if c.user else None
    return out


def _detail(db: Session, post: Post, user: User | None) -> PostDetailOut:
    like_count = (
        db.query(func.count(PostLike.post_id))
        .filter(PostLike.post_id == post.id)
        .scalar()
        or 0
    )
    is_liked = False
    is_bookmarked = False
    if user:
        is_liked = (
            db.query(PostLike.user_id)
            .filter(PostLike.post_id == post.id, PostLike.user_id == user.id)
            .limit(1)
            .scalar()
            is not None
        )
        is_bookmarked = (
            db.query(PostBookmark.user_id)
            .filter(PostBookmark.post_id == post.id, PostBookmark.user_id == user.id)
            .limit(1)
            .scalar()
            is not None
        )
    return PostDetailOut(
        **_post_out(post).model_dump(),
        comments=[_comment_out(c) for c in post.comments],
        like_count=like_count,
        is_liked=is_liked,
        is_bookmarked=is_bookmarked,
    )


@router.get("", response_model=list[PostOut])
def list_posts(
    event_id: int | None = Query(None),
    user_id: int | None = Query(None),
    visibility: str = Query("public"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Post).options(selectinload(Post.user))
    if visibility:
        q = q.filter(Post.visibility == visibility)
    if event_id:
        q = q.filter(Post.event_id == event_id)
    if user_id:
        q = q.filter(Post.user_id == user_id)
    rows = (
        q.order_by(Post.id.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return [_post_out(p) for p in rows]


@router.post("", response_model=PostOut, status_code=201)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    p = Post(
        user_id=current.id,
        event_id=payload.event_id,
        rating=payload.rating,
        content=payload.content,
        images=payload.images,
        visibility=payload.visibility,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _post_out(p)


@router.get("/{post_id}", response_model=PostDetailOut)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current: User | None = Depends(get_current_user_optional),
):
    post = (
        db.query(Post)
        .options(
            selectinload(Post.user),
            selectinload(Post.comments).selectinload(Comment.user),
        )
        .filter(Post.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(404, "Post not found")
    if post.visibility == "private" and (not current or current.id != post.user_id):
        raise HTTPException(404, "Post not found")
    return _detail(db, post, current)


@router.patch("/{post_id}", response_model=PostOut)
def update_post(
    post_id: int,
    payload: PostUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    if post.user_id != current.id:
        raise HTTPException(403, "Not your post")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(post, k, v)
    db.commit()
    db.refresh(post)
    return _post_out(post)


@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    if post.user_id != current.id:
        raise HTTPException(403, "Not your post")
    db.delete(post)
    db.commit()


# ---- comments ----
@router.post("/{post_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    post_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    c = Comment(post_id=post_id, user_id=current.id, content=payload.content)
    db.add(c)
    db.commit()
    db.refresh(c)
    return _comment_out(c)


# ---- likes ----
@router.post("/{post_id}/like", status_code=204)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if not db.get(Post, post_id):
        raise HTTPException(404, "Post not found")
    existing = db.query(PostLike).filter(
        PostLike.post_id == post_id, PostLike.user_id == current.id
    ).first()
    if not existing:
        db.add(PostLike(post_id=post_id, user_id=current.id))
        db.commit()


@router.delete("/{post_id}/like", status_code=204)
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    db.query(PostLike).filter(
        PostLike.post_id == post_id, PostLike.user_id == current.id
    ).delete()
    db.commit()


# ---- bookmarks ----
@router.post("/{post_id}/bookmark", status_code=204)
def bookmark_post(
    post_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if not db.get(Post, post_id):
        raise HTTPException(404, "Post not found")
    existing = db.query(PostBookmark).filter(
        PostBookmark.post_id == post_id, PostBookmark.user_id == current.id
    ).first()
    if not existing:
        db.add(PostBookmark(post_id=post_id, user_id=current.id))
        db.commit()


@router.delete("/{post_id}/bookmark", status_code=204)
def unbookmark_post(
    post_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    db.query(PostBookmark).filter(
        PostBookmark.post_id == post_id, PostBookmark.user_id == current.id
    ).delete()
    db.commit()
