from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_current_user, get_current_user_optional
from app.core.time import session_has_ended
from app.db.session import get_db
from app.models.event import Event, EventSession, EventTag
from app.models.group import Group, GroupMember
from app.models.post import Post, Comment, PostLike, PostBookmark
from app.models.registration import Registration
from app.models.user import User
from app.schemas.post import (
    CommentCreate, CommentOut, PostCreate, PostDetailOut, PostOut, PostUpdate,
)

router = APIRouter(prefix="/api/posts", tags=["posts"])


# ---------- helpers ----------

def _user_avatar(user: User | None) -> str | None:
    return user.avatar_url if user else None


def _is_group_member(db: Session, user: User | None, group_id: int) -> bool:
    if not user:
        return False
    return (
        db.query(GroupMember.user_id)
        .filter(GroupMember.group_id == group_id, GroupMember.user_id == user.id)
        .first()
        is not None
    )


def _can_view(db: Session, post: Post, viewer: User | None) -> bool:
    if post.visibility == "public":
        return True
    if post.visibility == "private":
        return bool(viewer and viewer.id == post.user_id)
    if post.visibility == "group":
        if not viewer:
            return False
        if viewer.id == post.user_id:
            return True
        if post.group_id is None:
            return False
        return _is_group_member(db, viewer, post.group_id)
    return False


def _user_attended_ended(db: Session, user: User, event_id: int) -> bool:
    """User has a successful registration to a session of this event AND the session has ended."""
    rows = (
        db.query(Registration, EventSession)
        .join(EventSession, EventSession.id == Registration.session_id)
        .filter(
            Registration.user_id == user.id,
            Registration.status == "success",
            EventSession.event_id == event_id,
        )
        .all()
    )
    for _reg, sess in rows:
        if session_has_ended(sess):
            return True
    return False


def _post_out(db: Session, p: Post) -> PostOut:
    out = PostOut.model_validate(p)
    out.user_name = p.user.name if p.user else None
    out.user_avatar = _user_avatar(p.user)
    if p.event_id:
        ev = db.get(Event, p.event_id)
        out.event_title = ev.title if ev else None
    if p.group_id:
        g = db.get(Group, p.group_id)
        out.group_name = g.name if g else None
    out.like_count = (
        db.query(func.count(PostLike.post_id)).filter(PostLike.post_id == p.id).scalar() or 0
    )
    out.bookmark_count = (
        db.query(func.count(PostBookmark.post_id)).filter(PostBookmark.post_id == p.id).scalar() or 0
    )
    out.comment_count = (
        db.query(func.count(Comment.id)).filter(Comment.post_id == p.id).scalar() or 0
    )
    return out


def _comment_out(c: Comment) -> CommentOut:
    out = CommentOut.model_validate(c)
    out.user_name = c.user.name if c.user else None
    out.user_avatar = _user_avatar(c.user)
    return out


def _detail(db: Session, post: Post, user: User | None) -> PostDetailOut:
    base = _post_out(db, post)
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
        **base.model_dump(),
        comments=[_comment_out(c) for c in post.comments],
        is_liked=is_liked,
        is_bookmarked=is_bookmarked,
    )


# ---------- list ----------

@router.get("", response_model=list[PostOut])
def list_posts(
    event_id: int | None = Query(None),
    user_id: int | None = Query(None),
    visibility: str | None = Query(None),
    group_id: int | None = Query(None),
    is_board_post: bool | None = Query(None),
    category: str | None = Query(None),  # filter by linked event's category
    tag: str | None = Query(None),       # filter by linked event's tag
    keyword: str | None = Query(None),
    tab: str | None = Query(None, pattern="^(all|hot|new|mine|bookmarked|private)$"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: User | None = Depends(get_current_user_optional),
):
    q = db.query(Post).options(selectinload(Post.user))

    # Visibility gating: anonymous viewers see only public; authed see public + own private + group posts where they're a member
    if not current:
        q = q.filter(Post.visibility == "public")
    else:
        member_groups = (
            db.query(GroupMember.group_id).filter(GroupMember.user_id == current.id).subquery()
        )
        q = q.filter(
            or_(
                Post.visibility == "public",
                and_(Post.visibility == "private", Post.user_id == current.id),
                and_(Post.visibility == "group", Post.group_id.in_(member_groups)),
            )
        )

    if visibility:
        q = q.filter(Post.visibility == visibility)
    if event_id:
        q = q.filter(Post.event_id == event_id)
    if user_id:
        q = q.filter(Post.user_id == user_id)
    if group_id:
        q = q.filter(Post.group_id == group_id)
    if is_board_post is not None:
        q = q.filter(Post.is_board_post == is_board_post)
    if category:
        # Filter by the linked event's category — used by board page tabs
        cat_events = db.query(Event.id).filter(Event.category == category).subquery()
        q = q.filter(Post.event_id.in_(cat_events))
    if tag:
        tag_events = db.query(EventTag.event_id).filter(EventTag.tag == tag).subquery()
        q = q.filter(Post.event_id.in_(tag_events))
    if keyword:
        kw = keyword.lower()
        like = f"%{kw}%"
        q = q.filter(
            (func.lower(func.coalesce(Post.title, "")).like(like))
            | (func.lower(Post.content).like(like))
        )

    # Board sidebar tabs
    if tab == "mine" and current:
        q = q.filter(Post.user_id == current.id)
    elif tab == "bookmarked" and current:
        bm = db.query(PostBookmark.post_id).filter(PostBookmark.user_id == current.id).subquery()
        q = q.filter(Post.id.in_(bm))
    elif tab == "private" and current:
        q = q.filter(Post.visibility == "private", Post.user_id == current.id)

    if tab == "hot":
        like_sub = (
            db.query(PostLike.post_id, func.count(PostLike.user_id).label("c"))
            .group_by(PostLike.post_id)
            .subquery()
        )
        bm_sub = (
            db.query(PostBookmark.post_id, func.count(PostBookmark.user_id).label("c"))
            .group_by(PostBookmark.post_id)
            .subquery()
        )
        q = (
            q.outerjoin(like_sub, like_sub.c.post_id == Post.id)
            .outerjoin(bm_sub, bm_sub.c.post_id == Post.id)
            .order_by(
                (func.coalesce(like_sub.c.c, 0) + func.coalesce(bm_sub.c.c, 0)).desc(),
                Post.id.desc(),
            )
        )
    else:
        q = q.order_by(Post.id.desc())

    rows = q.offset((page - 1) * size).limit(size).all()
    return [_post_out(db, p) for p in rows]


# ---------- create ----------

@router.post("", response_model=PostOut, status_code=201)
def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if payload.is_board_post:
        if payload.event_id is None:
            raise HTTPException(400, "Board posts must link to an event")
        if not _user_attended_ended(db, current, payload.event_id):
            raise HTTPException(
                403, "Board posts require a successful registration to an ended session of this event"
            )

    if payload.visibility == "group":
        if payload.group_id is None:
            raise HTTPException(400, "group_id required when visibility=group")
        if not _is_group_member(db, current, payload.group_id):
            raise HTTPException(403, "Not a member of the target group")

    p = Post(
        user_id=current.id,
        event_id=payload.event_id,
        title=payload.title,
        rating=payload.rating,
        content=payload.content,
        images=payload.images,
        visibility=payload.visibility,
        group_id=payload.group_id if payload.visibility == "group" else None,
        is_board_post=payload.is_board_post,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _post_out(db, p)


# ---------- get / patch / delete ----------

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
    if not _can_view(db, post, current):
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
    if data.get("visibility") == "group":
        gid = data.get("group_id", post.group_id)
        if gid is None or not _is_group_member(db, current, gid):
            raise HTTPException(403, "Not a member of the target group")
    for k, v in data.items():
        setattr(post, k, v)
    db.commit()
    db.refresh(post)
    return _post_out(db, post)


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
    if not _can_view(db, post, current):
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
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    if not _can_view(db, post, current):
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
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    if not _can_view(db, post, current):
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
