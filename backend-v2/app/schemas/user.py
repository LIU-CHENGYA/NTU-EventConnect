import re
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    student_id: str | None = None
    department: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    is_admin: bool = False
    created_at: datetime

    @model_validator(mode="after")
    def _admin_from_whitelist(self):
        # Admin status is derived from the email whitelist, not the DB column,
        # so the frontend's `isAdmin` flag reflects admin_whitelist.txt.
        from app.core.admin import is_admin_email

        self.is_admin = is_admin_email(self.email)
        return self


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    needs_username: bool = False


class GoogleLoginRequest(BaseModel):
    credential: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)
