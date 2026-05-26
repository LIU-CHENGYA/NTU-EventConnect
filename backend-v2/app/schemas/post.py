from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


_VISIBILITY = "^(public|private|group)$"


class PostCreate(BaseModel):
    event_id: int | None = None
    title: str | None = Field(None, max_length=200)
    rating: int = Field(0, ge=0, le=5)
    content: str = Field(min_length=1)
    images: list[str] = []
    visibility: str = Field("public", pattern=_VISIBILITY)
    group_id: int | None = None
    is_board_post: bool = False
    is_draft: bool = False

    @model_validator(mode="after")
    def _check_group(self):
        if self.visibility == "group" and self.group_id is None:
            raise ValueError("group_id is required when visibility=group")
        if self.is_board_post and self.event_id is None:
            raise ValueError("Board posts must link to an event")
        return self


class PostUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    rating: int | None = Field(None, ge=0, le=5)
    content: str | None = None
    images: list[str] | None = None
    visibility: str | None = Field(None, pattern=_VISIBILITY)
    group_id: int | None = None
    is_draft: bool | None = None

    @model_validator(mode="after")
    def _check_group(self):
        # Mirrors PostCreate: prevent visibility=group with no target.
        # Without this, switching a non-group post to group via PATCH
        # would land in update_post with group_id=None and trigger a
        # misleading 403 "Not a member" instead of a clear 422.
        if self.visibility == "group" and self.group_id is None:
            raise ValueError("group_id is required when visibility=group")
        return self


class CommentCreate(BaseModel):
    content: str = Field(min_length=1)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    post_id: int
    user_id: int
    user_name: str | None = None
    user_avatar: str | None = None
    content: str
    created_at: datetime


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    user_name: str | None = None
    user_avatar: str | None = None
    event_id: int | None
    event_title: str | None = None
    title: str | None = None
    rating: int
    content: str
    images: list[str]
    visibility: str
    group_id: int | None = None
    group_name: str | None = None
    is_board_post: bool = False
    is_draft: bool = False
    like_count: int = 0
    bookmark_count: int = 0
    comment_count: int = 0
    # Per-viewer toggle state. Populated by _post_out() when a current user is
    # available, false otherwise. Exposing this on the list response is required
    # so the heart/bookmark icons start in the correct state — without it, list
    # views always render as "not liked" until a detail navigation refreshes.
    is_liked: bool = False
    is_bookmarked: bool = False
    created_at: datetime
    updated_at: datetime


class PostDetailOut(PostOut):
    comments: list[CommentOut] = []
