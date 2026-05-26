from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RegistrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    session_id: int
    status: str
    registered_at: datetime


class RegistrationDetailOut(RegistrationOut):
    event_id: int | None = None
    event_title: str | None = None
    event_image: str | None = None
    # Both axis are surfaced for the board post create dialog: it groups past
    # registrations and falls back across columns when one is missing.
    category: str | None = None
    official_category: str | None = None
    session_name: str | None = None
    date: str | None = None
    time: str | None = None
    location: str | None = None


class EventRegistrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    registration_id: int
    user_id: int
    user_name: str | None = None
    user_email: str | None = None
    student_id: str | None = None
    department: str | None = None
    session_id: int
    session_name: str | None = None
    status: str
    registered_at: datetime
