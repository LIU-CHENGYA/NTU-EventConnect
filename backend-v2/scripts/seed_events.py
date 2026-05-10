"""
Seed Event + EventSession from fetch_data/csv/events.csv.

Groups CSV rows by parent_url -> Event, each row -> EventSession.
Idempotent: upsert by source_url.

Usage:
    python -m scripts.seed_events
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

# Allow running as a script: add backend/ to sys.path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.db.session import Base, SessionLocal, engine  # noqa: E402
from app.models.event import Event, EventSession, EventTag  # noqa: E402
from app import models  # noqa: F401, E402

def _csv_dir() -> Path:
    """Locate fetch_data/csv across host and docker-compose layouts.

    - Host: backend-v2/ is sibling of fetch_data/  → ROOT.parent/fetch_data
    - Container: scripts/ and fetch_data/ are both volume-mounted under /app
      → ROOT/fetch_data (mounted via docker-compose volumes:)

    `FETCH_DATA_DIR` env var overrides both for explicit deployments.
    """
    import os
    env = os.getenv("FETCH_DATA_DIR")
    if env:
        return Path(env) / "csv"
    sibling = ROOT.parent / "fetch_data" / "csv"
    inside = ROOT / "fetch_data" / "csv"
    return inside if inside.exists() else sibling


CSV_PATH = _csv_dir() / "events.csv"
TAGS_CSV_PATH = _csv_dir() / "events_tags.csv"

DEFAULT_IMAGES = {
    "講座": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
    "課程": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    "工作坊": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
    "研習": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
    "活動": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    "比賽": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
    "展覽": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
    "演唱會": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
}
FALLBACK_IMAGE = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800"

_DT_RE = re.compile(r"(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2})?")


def pick_image(activity_type: str) -> str:
    if not activity_type:
        return FALLBACK_IMAGE
    for k, v in DEFAULT_IMAGES.items():
        if k in activity_type:
            return v
    return FALLBACK_IMAGE


def parse_int(s: str) -> int:
    if not s:
        return 0
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else 0


def parse_session_time(s: str) -> tuple[str, str]:
    if not s:
        return ("", "")
    parts = [p.strip() for p in s.split("~")]
    if len(parts) != 2:
        m = _DT_RE.search(s)
        return (m.group(1) if m else "", m.group(2) if m else "")
    m1 = _DT_RE.search(parts[0])
    if not m1:
        return ("", "")
    d1, t1 = m1.group(1), m1.group(2)
    m2 = _DT_RE.search(parts[1]) or re.search(r"(\d{2}:\d{2})", parts[1])
    if m2 and m2.lastindex == 2:
        return (d1, f"{t1} - {m2.group(2)}")
    if m2:
        return (d1, f"{t1} - {m2.group(1)}")
    return (d1, t1)


def parse_reg_time(s: str) -> tuple[str, str]:
    if not s:
        return ("", "")
    parts = [p.strip() for p in s.split("~")]
    if len(parts) != 2:
        return ("", "")

    def fmt(p: str) -> str:
        m = _DT_RE.search(p)
        return f"{m.group(1)} {m.group(2)}" if m else ""

    return (fmt(parts[0]), fmt(parts[1]))


def parse_contact(s: str) -> tuple[str, str, str]:
    if not s:
        return ("", "", "")
    parts = [p.strip() for p in s.split(";")]
    name = parts[0] if parts else ""
    phone = ""
    email = ""
    for p in parts[1:]:
        if "@" in p:
            email = p
        elif re.search(r"\d", p):
            phone = p
    return (name, phone, email)


def norm(s: str) -> str | None:
    if not s:
        return None
    v = s.strip()
    if v in ("無", "None", "-", "—", ""):
        return None
    return v


# 公式分類 = life_learning_type の `/` 先頭セグメント。NTU actionList.aspx
# の大項目に対応。「活動總表」「過期活動總表」は集計用バケットで意味の無い
# ノイズなので NULL に倒す。
_OFFICIAL_NOISE = {"活動總表", "過期活動總表"}


def extract_official_category(life_learning_type: str | None) -> str | None:
    if not life_learning_type:
        return None
    head = life_learning_type.split("/")[0].strip()
    if not head or head in _OFFICIAL_NOISE:
        return None
    return head


def seed(db, csv_path: Path = CSV_PATH, limit: int | None = None) -> tuple[int, int]:
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))

    events_by_url: dict[str, Event] = {}
    sessions_created = 0

    for row in rows:
        parent_url = (row.get("parent_url") or "").strip()
        event_url = (row.get("event_url") or "").strip()
        if not parent_url or not event_url:
            continue

        if parent_url not in events_by_url:
            existing = db.query(Event).filter(Event.source_url == parent_url).first()
            category = (row.get("activity_type") or "").strip()
            category_clean = re.sub(r"\s*\([^)]*\)\s*$", "", category) or "活動"
            official = extract_official_category(row.get("life_learning_type", ""))
            if existing:
                # Idempotent backfill: existing rows seeded before official_category
                # was introduced will have official_category=NULL; populate it.
                if official and existing.official_category != official:
                    existing.official_category = official
                events_by_url[parent_url] = existing
            else:
                name, phone, email = parse_contact(row.get("organizer_contact", ""))
                ev = Event(
                    source_url=parent_url,
                    title=(row.get("activity_name_event_page")
                           or row.get("activity_name_activity_session")
                           or "(無標題)").strip(),
                    content=norm(row.get("activity_content", "")),
                    category=category_clean,
                    official_category=official,
                    image_url=pick_image(category),
                    organizer=norm(row.get("organizer_unit", "")),
                    organizer_contact=name or None,
                    contact_phone=phone or None,
                    contact_email=email or None,
                    registration_type=norm(row.get("registration_type", "")),
                    registration_fee=norm(row.get("registration_fee", "")),
                    target_audience=norm(row.get("target_audience", "")),
                    restrictions=norm(row.get("other_restrictions", ""))
                                 or norm(row.get("activity_limit", "")),
                    learning_category=norm(row.get("learning_category", ""))
                                      or norm(row.get("life_learning_type", "")),
                )
                db.add(ev)
                db.flush()
                events_by_url[parent_url] = ev

        event = events_by_url[parent_url]
        if db.query(EventSession).filter(EventSession.source_url == event_url).first():
            continue

        date, time_range = parse_session_time(row.get("session_time", ""))
        reg_start, reg_end = parse_reg_time(row.get("registration_time", ""))

        sess = EventSession(
            event_id=event.id,
            source_url=event_url,
            session_name=norm(row.get("session_name", "")),
            session_content=norm(row.get("session_content", "")),
            instructor=norm(row.get("instructor", "")),
            location=norm(row.get("location", "")),
            date=date or None,
            time_range=time_range or None,
            raw_session_time=norm(row.get("session_time", "")),
            registration_start=reg_start or None,
            registration_end=reg_end or None,
            capacity=parse_int(row.get("capacity", "")),
            remaining_slots=parse_int(row.get("remaining_slots", "")),
            meal=norm(row.get("meal", "")),
            civil_servant_hours=norm(row.get("civil_servant_hours", "")),
            study_hours=norm(row.get("study_hours", "")),
        )
        db.add(sess)
        sessions_created += 1

        if limit and sessions_created >= limit:
            break

    db.commit()
    return (len(events_by_url), sessions_created)


def seed_tags(db, csv_path: Path = TAGS_CSV_PATH) -> int:
    """Load events_tags.csv (event_url, tag) and attach tags to events.

    The CSV uses the per-session sessionView URL; we map it to the parent
    sessionList URL stored on Event.source_url by trimming sesID.
    """
    if not csv_path.exists():
        return 0

    # Build: parent_url -> Event id
    sess_to_event: dict[str, int] = {}
    for sess, ev in db.query(EventSession, Event).join(Event, Event.id == EventSession.event_id).all():
        sess_to_event[sess.source_url] = ev.id

    inserted = 0
    seen: set[tuple[int, str]] = set()
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            url = (row.get("event_url") or "").strip()
            tag = (row.get("tag") or "").strip()
            if not url or not tag:
                continue
            event_id = sess_to_event.get(url)
            if event_id is None:
                continue
            key = (event_id, tag)
            if key in seen:
                continue
            seen.add(key)
            existing = (
                db.query(EventTag)
                .filter(EventTag.event_id == event_id, EventTag.tag == tag)
                .first()
            )
            if existing:
                continue
            db.add(EventTag(event_id=event_id, tag=tag))
            inserted += 1
    db.commit()
    return inserted


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        e, s = seed(db)
        t = seed_tags(db)
        print(f"[OK] events={e} sessions={s} tags={t}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
