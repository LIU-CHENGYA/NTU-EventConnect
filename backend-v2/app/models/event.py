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
    # Phase 2.2: NTU 「官方分類」 = 母活動名 (activity_name_activity_session)。
    # info.md L30 + Figma 準拠。複数場次を 1 個の母活動チップにまとめる軸。
    # legacy `category` (= activity_type 講座/工作坊...) はタグとしても event_tags に書く。
    official_category: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    # English variants seeded from fetch_data/csv/events_en.csv (manual translation).
    # Null when no EN row exists for this parent_url; API falls back to ZH.
    title_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    official_category_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    organizer_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    registration_type_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    registration_fee_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    target_audience_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    restrictions_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    learning_category_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    sessions: Mapped[list["EventSession"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
    tags: Mapped[list["EventTag"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )


class EventTag(Base):
    __tablename__ = "event_tags"

    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), primary_key=True
    )
    tag: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    event: Mapped["Event"] = relationship(back_populates="tags")


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
    # English variants seeded from fetch_data/csv/events_en.csv (manual translation).
    session_name_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    session_content_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructor_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    location_en: Mapped[str | None] = mapped_column(String(300), nullable=True)
    meal_en: Mapped[str | None] = mapped_column(String(100), nullable=True)

    event: Mapped["Event"] = relationship(back_populates="sessions")
