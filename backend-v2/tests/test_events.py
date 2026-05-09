from app.models.event import Event, EventSession


def _seed(client):
    db = client.db_factory()
    try:
        e1 = Event(
            source_url="https://example.com/parent/1",
            title="人工智慧工作坊",
            content="AI workshop content",
            category="工作坊",
            image_url="https://img/1",
        )
        e2 = Event(
            source_url="https://example.com/parent/2",
            title="心理輔導講座",
            content="lecture content",
            category="講座",
            image_url="https://img/2",
        )
        db.add_all([e1, e2])
        db.flush()
        db.add_all([
            EventSession(
                event_id=e1.id, source_url="https://example.com/s/1a",
                session_name="第一場", date="2026-06-01",
                time_range="10:00 - 12:00", capacity=30, remaining_slots=10,
            ),
            EventSession(
                event_id=e1.id, source_url="https://example.com/s/1b",
                session_name="第二場", date="2026-06-08",
                time_range="10:00 - 12:00", capacity=30, remaining_slots=5,
            ),
            EventSession(
                event_id=e2.id, source_url="https://example.com/s/2a",
                session_name="主場", date="2026-07-01",
                time_range="14:00 - 16:00", capacity=100, remaining_slots=80,
            ),
        ])
        db.commit()
        return e1.id, e2.id
    finally:
        db.close()


def test_list_events_empty(client):
    r = client.get("/api/events")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 0
    assert body["items"] == []


def test_list_events(client):
    _seed(client)
    r = client.get("/api/events")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2
    titles = {e["title"] for e in body["items"]}
    assert "人工智慧工作坊" in titles


def test_list_filter_by_category(client):
    _seed(client)
    r = client.get("/api/events", params={"category": "講座"})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["category"] == "講座"


def test_list_filter_category_all(client):
    _seed(client)
    r = client.get("/api/events", params={"category": "全部"})
    assert r.json()["total"] == 2


def test_list_filter_by_keyword(client):
    _seed(client)
    r = client.get("/api/events", params={"keyword": "人工智慧"})
    assert r.json()["total"] == 1


def test_list_pagination(client):
    _seed(client)
    r = client.get("/api/events", params={"page": 1, "size": 1})
    body = r.json()
    assert body["total"] == 2
    assert len(body["items"]) == 1
    assert body["page"] == 1


def test_event_detail_includes_sessions(client):
    e1, _ = _seed(client)
    r = client.get(f"/api/events/{e1}")
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == "人工智慧工作坊"
    assert len(body["sessions"]) == 2
    assert {s["session_name"] for s in body["sessions"]} == {"第一場", "第二場"}


def test_event_detail_404(client):
    r = client.get("/api/events/9999")
    assert r.status_code == 404


def test_session_detail(client):
    e1, _ = _seed(client)
    detail = client.get(f"/api/events/{e1}").json()
    sid = detail["sessions"][0]["id"]
    r = client.get(f"/api/events/{e1}/sessions/{sid}")
    assert r.status_code == 200
    assert r.json()["id"] == sid


def test_session_detail_wrong_event(client):
    e1, e2 = _seed(client)
    detail = client.get(f"/api/events/{e1}").json()
    sid = detail["sessions"][0]["id"]
    # session belongs to e1, querying via e2 should 404
    r = client.get(f"/api/events/{e2}/sessions/{sid}")
    assert r.status_code == 404


def test_session_detail_404(client):
    e1, _ = _seed(client)
    r = client.get(f"/api/events/{e1}/sessions/99999")
    assert r.status_code == 404
