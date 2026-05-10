from pydantic import BaseModel, ConfigDict ,field_validator


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
    official_category: str | None = None
    image_url: str | None = None
    organizer: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    registration_type: str | None = None
    registration_fee: str | None = None
    target_audience: str | None = None
    learning_category: str | None = None
    tags: list[str] = []

    @field_validator("tags", mode="before")
    @classmethod
    def extract_tag_names(cls, v):
        if not v:
            return []
        # ORM 物件就取 .tag 屬性，已經是字串就直接回傳
        return [t.tag if hasattr(t, "tag") else t for t in v]

class EventDetailOut(EventOut):
    sessions: list[EventSessionOut] = []


class TagOut(BaseModel):
    name: str
    count: int


class EventListResponse(BaseModel):
    items: list[EventDetailOut]
    total: int
    page: int
    size: int
