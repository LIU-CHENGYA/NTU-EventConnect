from app.models.event import Event, EventSession


def _register(client, email):
    r = client.post("/api/auth/register", json={
        "email": email, "password": "secret123", "name": "U",
    })
    return r.json()["access_token"], r.json()["user"]["id"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _make_event_with_session(client, capacity=2, remaining=2):
    db = client.db_factory()
    try:
        e = Event(source_url="http://x/p", title="活動", category="講座")
        db.add(e); db.flush()
        s = EventSession(
            event_id=e.id, source_url="http://x/s",
            session_name="場次", date="2026-06-01",
            capacity=capacity, remaining_slots=remaining,
        )
        db.add(s); db.commit()
        return e.id, s.id
    finally:
        db.close()


def _slots(client, sid):
    db = client.db_factory()
    try:
        return db.get(EventSession, sid).remaining_slots
    finally:
        db.close()


def test_register_session_success(client):
    t, _ = _register(client, "a@b.com")
    eid, sid = _make_event_with_session(client, remaining=2)
    r = client.post(f"/api/sessions/{sid}/register", headers=_auth(t))
    assert r.status_code == 201
    assert r.json()["status"] == "success"
    assert _slots(client, sid) == 1


def test_register_waitlist_when_full(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    _, sid = _make_event_with_session(client, remaining=1)
    assert client.post(f"/api/sessions/{sid}/register", headers=_auth(t1)).json()["status"] == "success"
    r = client.post(f"/api/sessions/{sid}/register", headers=_auth(t2))
    assert r.json()["status"] == "waitlist"
    assert _slots(client, sid) == 0


def test_double_register_conflict(client):
    t, _ = _register(client, "a@b.com")
    _, sid = _make_event_with_session(client)
    client.post(f"/api/sessions/{sid}/register", headers=_auth(t))
    r = client.post(f"/api/sessions/{sid}/register", headers=_auth(t))
    assert r.status_code == 409


def test_cancel_releases_slot_and_promotes_waitlist(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    t3, _ = _register(client, "c@b.com")
    _, sid = _make_event_with_session(client, remaining=1)

    r1 = client.post(f"/api/sessions/{sid}/register", headers=_auth(t1)).json()
    r2 = client.post(f"/api/sessions/{sid}/register", headers=_auth(t2)).json()
    r3 = client.post(f"/api/sessions/{sid}/register", headers=_auth(t3)).json()
    assert r1["status"] == "success"
    assert r2["status"] == "waitlist"
    assert r3["status"] == "waitlist"

    # cancel r1 → r2 should be promoted
    cancel = client.delete(f"/api/registrations/{r1['id']}", headers=_auth(t1))
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"

    listing = client.get("/api/users/me/registrations", headers=_auth(t2)).json()
    assert listing[0]["status"] == "success"

    listing3 = client.get("/api/users/me/registrations", headers=_auth(t3)).json()
    assert listing3[0]["status"] == "waitlist"

    # slot count should still be 0 (promoted user took it)
    assert _slots(client, sid) == 0


def test_cancel_waitlist_doesnt_release_slot(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    _, sid = _make_event_with_session(client, remaining=1)
    client.post(f"/api/sessions/{sid}/register", headers=_auth(t1))
    r2 = client.post(f"/api/sessions/{sid}/register", headers=_auth(t2)).json()
    assert _slots(client, sid) == 0
    client.delete(f"/api/registrations/{r2['id']}", headers=_auth(t2))
    assert _slots(client, sid) == 0  # still 0


def test_cancel_other_user_forbidden(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    _, sid = _make_event_with_session(client)
    rid = client.post(f"/api/sessions/{sid}/register", headers=_auth(t1)).json()["id"]
    r = client.delete(f"/api/registrations/{rid}", headers=_auth(t2))
    assert r.status_code == 403


def test_register_missing_session(client):
    t, _ = _register(client, "a@b.com")
    r = client.post("/api/sessions/9999/register", headers=_auth(t))
    assert r.status_code == 404


def test_register_requires_auth(client):
    _, sid = _make_event_with_session(client)
    r = client.post(f"/api/sessions/{sid}/register")
    assert r.status_code == 401


def test_my_registrations_includes_event_info(client):
    t, _ = _register(client, "a@b.com")
    eid, sid = _make_event_with_session(client)
    client.post(f"/api/sessions/{sid}/register", headers=_auth(t))
    rows = client.get("/api/users/me/registrations", headers=_auth(t)).json()
    assert len(rows) == 1
    assert rows[0]["event_id"] == eid
    assert rows[0]["event_title"] == "活動"
    assert rows[0]["session_name"] == "場次"
    assert rows[0]["date"] == "2026-06-01"


def test_re_register_after_cancel(client):
    t, _ = _register(client, "a@b.com")
    _, sid = _make_event_with_session(client, remaining=1)
    rid = client.post(f"/api/sessions/{sid}/register", headers=_auth(t)).json()["id"]
    client.delete(f"/api/registrations/{rid}", headers=_auth(t))
    r = client.post(f"/api/sessions/{sid}/register", headers=_auth(t))
    assert r.status_code == 201
    assert r.json()["status"] == "success"
