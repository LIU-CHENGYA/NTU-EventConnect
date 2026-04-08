from pydantic import BaseModel, ConfigDict


class EventSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    session_name: str | None = None
    session_content: str | None = None
    instructor: str | None = None
    location: str | None = None
    date: str | None = None
    time_range: str | None = None
    registration_start: str | None = None
    registration_end: str | None = None
    capacity: int
    remaining_slots: int
    meal: str | None = None
    civil_servant_hours: str | None = None
    study_hours: str | None = None


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str | None = None
    category: str | None = None
    image_url: str | None = None
    organizer: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    registration_type: str | None = None
    registration_fee: str | None = None
    target_audience: str | None = None
    learning_category: str | None = None


class EventDetailOut(EventOut):
    sessions: list[EventSessionOut] = []


class EventListResponse(BaseModel):
    items: list[EventDetailOut]
    total: int
    page: int
    size: int
