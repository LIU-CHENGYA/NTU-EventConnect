from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PostCreate(BaseModel):
    event_id: int | None = None
    rating: int = Field(0, ge=0, le=5)
    content: str = Field(min_length=1)
    images: list[str] = []
    visibility: str = Field("public", pattern="^(public|private)$")


class PostUpdate(BaseModel):
    rating: int | None = Field(None, ge=0, le=5)
    content: str | None = None
    images: list[str] | None = None
    visibility: str | None = Field(None, pattern="^(public|private)$")


class CommentCreate(BaseModel):
    content: str = Field(min_length=1)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    post_id: int
    user_id: int
    user_name: str | None = None
    content: str
    created_at: datetime


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    user_name: str | None = None
    event_id: int | None
    rating: int
    content: str
    images: list[str]
    visibility: str
    created_at: datetime
    updated_at: datetime


class PostDetailOut(PostOut):
    comments: list[CommentOut] = []
    like_count: int = 0
    is_liked: bool = False
    is_bookmarked: bool = False
