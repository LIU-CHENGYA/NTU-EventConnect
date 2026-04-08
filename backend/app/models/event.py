from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_url: Mapped[str] = mapped_column(String(500), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    organizer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    organizer_contact: Mapped[str | None] = mapped_column(String(200), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    registration_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    registration_fee: Mapped[str | None] = mapped_column(String(100), nullable=True)
    target_audience: Mapped[str | None] = mapped_column(String(500), nullable=True)
    restrictions: Mapped[str | None] = mapped_column(String(500), nullable=True)
    learning_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    sessions: Mapped[list["EventSession"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )


class EventSession(Base):
    __tablename__ = "event_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    source_url: Mapped[str] = mapped_column(String(500), unique=True, index=True)
    session_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    session_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructor: Mapped[str | None] = mapped_column(String(200), nullable=True)
    location: Mapped[str | None] = mapped_column(String(300), nullable=True)
    date: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)
    time_range: Mapped[str | None] = mapped_column(String(100), nullable=True)
    raw_session_time: Mapped[str | None] = mapped_column(String(200), nullable=True)
    registration_start: Mapped[str | None] = mapped_column(String(30), nullable=True)
    registration_end: Mapped[str | None] = mapped_column(String(30), nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    remaining_slots: Mapped[int] = mapped_column(Integer, default=0)
    meal: Mapped[str | None] = mapped_column(String(100), nullable=True)
    civil_servant_hours: Mapped[str | None] = mapped_column(String(50), nullable=True)
    study_hours: Mapped[str | None] = mapped_column(String(50), nullable=True)

    event: Mapped["Event"] = relationship(back_populates="sessions")
