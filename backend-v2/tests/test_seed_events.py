import csv
from pathlib import Path

from scripts.seed_events import seed
from app.models.event import Event, EventSession


CSV_HEADERS = [
    "parent_url", "activity_name_activity_session", "activity_content",
    "activity_type", "life_learning_type", "outside_url", "activity_limit",
    "event_url", "activity_name_event_page", "session_name", "session_content",
    "instructor", "location", "session_time", "registration_time",
    "organizer_unit", "organizer_contact", "registration_type",
    "target_audience", "other_restrictions", "registration_fee", "capacity",
    "remaining_slots", "meal", "civil_servant_hours", "study_hours",
    "learning_category", "credit", "term", "city", "attachment", "note",
]


def _row(**overrides):
    base = {h: "" for h in CSV_HEADERS}
    base.update(overrides)
    return base


def _write_csv(tmp_path: Path, rows: list[dict]) -> Path:
    p = tmp_path / "events.csv"
    with open(p, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    return p


def test_seed_groups_sessions_under_event(client, tmp_path):
    csv_path = _write_csv(tmp_path, [
        _row(
            parent_url="http://x/p1", event_url="http://x/s1",
            activity_name_event_page="活動A", session_name="場次1",
            activity_type="講座", session_time="2026-06-08 12:20:00 ~ 14:00:00",
            registration_time="2026-02-02 08:00:00 ~ 2026-06-01 17:00:00",
            organizer_unit="心輔中心", organizer_contact="王小明;02-12345;a@b.com",
            capacity="100", remaining_slots="30",
        ),
        _row(
            parent_url="http://x/p1", event_url="http://x/s2",
            activity_name_event_page="活動A", session_name="場次2",
            activity_type="講座", session_time="2026-06-15 12:20:00 ~ 14:00:00",
            capacity="100", remaining_slots="20",
        ),
        _row(
            parent_url="http://x/p2", event_url="http://x/s3",
            activity_name_event_page="活動B", session_name="主場",
            activity_type="工作坊", session_time="2026-07-01 09:00:00 ~ 12:00:00",
            capacity="50", remaining_slots="50",
        ),
    ])

    db = client.db_factory()
    try:
        events, sessions = seed(db, csv_path=csv_path)
        assert events == 2
        assert sessions == 3
        assert db.query(Event).count() == 2
        assert db.query(EventSession).count() == 3

        ev_a = db.query(Event).filter(Event.source_url == "http://x/p1").one()
        assert ev_a.title == "活動A"
        assert ev_a.category == "講座"
        assert ev_a.contact_email == "a@b.com"
        assert len(ev_a.sessions) == 2

        s1 = db.query(EventSession).filter(EventSession.source_url == "http://x/s1").one()
        assert s1.date == "2026-06-08"
        assert s1.time_range == "12:20 - 14:00"
        assert s1.capacity == 100
        assert s1.remaining_slots == 30
    finally:
        db.close()


def test_seed_is_idempotent(client, tmp_path):
    csv_path = _write_csv(tmp_path, [
        _row(
            parent_url="http://x/p1", event_url="http://x/s1",
            activity_name_event_page="A", activity_type="講座",
            session_time="2026-06-08 12:20:00 ~ 14:00:00",
            capacity="10", remaining_slots="5",
        ),
    ])
    db = client.db_factory()
    try:
        seed(db, csv_path=csv_path)
        seed(db, csv_path=csv_path)
        assert db.query(Event).count() == 1
        assert db.query(EventSession).count() == 1
    finally:
        db.close()
