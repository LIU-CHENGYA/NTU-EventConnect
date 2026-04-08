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
    session_name: str | None = None
    date: str | None = None
    location: str | None = None
