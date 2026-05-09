from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    invite_emails: list[EmailStr] = []


class GroupUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)


class GroupMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    user_name: str | None = None
    user_email: str | None = None
    user_avatar: str | None = None
    joined_at: datetime


class GroupInvitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    status: str
    created_at: datetime


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    owner_id: int
    member_count: int = 0
    post_count: int = 0
    created_at: datetime


class GroupDetailOut(GroupOut):
    members: list[GroupMemberOut] = []
    invitations: list[GroupInvitationOut] = []


class InviteCreate(BaseModel):
    email: EmailStr
