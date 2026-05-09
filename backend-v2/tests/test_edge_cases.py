"""Additional edge-case tests from TEST_PLAN.md"""
from app.models.event import Event, EventSession
from app.models.post import PostLike, PostBookmark, Comment


def _register(client, email="a@b.com"):
    r = client.post("/api/auth/register", json={
        "email": email, "password": "secret123", "name": "U",
    })
    return r.json()["access_token"], r.json()["user"]["id"]


def _auth(t):
    return {"Authorization": f"Bearer {t}"}


def _make_event(client):
    db = client.db_factory()
    try:
        e = Event(source_url="http://x/e", title="活動", category="講座")
        db.add(e); db.commit(); db.refresh(e)
        return e.id
    finally:
        db.close()


def _make_session(client, remaining=2):
    db = client.db_factory()
    try:
        e = Event(source_url="http://x/e2", title="活動2", category="講座")
        db.add(e); db.flush()
        s = EventSession(
            event_id=e.id, source_url="http://x/s2",
            session_name="場次", date="2026-06-01",
            capacity=remaining, remaining_slots=remaining,
        )
        db.add(s); db.commit()
        return s.id
    finally:
        db.close()


# ---- private post access ----
def test_private_post_not_visible_to_others(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    pid = client.post("/api/posts", headers=_auth(t1),
                      json={"content": "secret", "visibility": "private"}).json()["id"]

    # owner can see
    assert client.get(f"/api/posts/{pid}", headers=_auth(t1)).status_code == 200
    # other user cannot
    assert client.get(f"/api/posts/{pid}", headers=_auth(t2)).status_code == 404
    # anonymous cannot
    assert client.get(f"/api/posts/{pid}").status_code == 404


# ---- cascade delete ----
def test_delete_post_cascades_comments_likes_bookmarks(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    pid = client.post("/api/posts", headers=_auth(t1),
                      json={"content": "x"}).json()["id"]
    client.post(f"/api/posts/{pid}/comments", headers=_auth(t2), json={"content": "hi"})
    client.post(f"/api/posts/{pid}/like", headers=_auth(t2))
    client.post(f"/api/posts/{pid}/bookmark", headers=_auth(t2))

    assert client.delete(f"/api/posts/{pid}", headers=_auth(t1)).status_code == 204

    db = client.db_factory()
    try:
        assert db.query(Comment).filter(Comment.post_id == pid).count() == 0
        assert db.query(PostLike).filter(PostLike.post_id == pid).count() == 0
        assert db.query(PostBookmark).filter(PostBookmark.post_id == pid).count() == 0
    finally:
        db.close()


# ---- post on missing event ----
def test_create_post_missing_event_allowed_as_null(client):
    """post with no event_id (pure journal) works; but bad event_id reference should still store
    since FK is SET NULL on delete. At create-time we don't validate event existence — that's OK."""
    t, _ = _register(client, "a@b.com")
    r = client.post("/api/posts", headers=_auth(t), json={"content": "diary"})
    assert r.status_code == 201
    assert r.json()["event_id"] is None


# ---- bookmark idempotency ----
def test_event_bookmark_toggle_is_idempotent(client):
    t, _ = _register(client, "a@b.com")
    eid = _make_event(client)
    # double-bookmark
    assert client.post(f"/api/events/{eid}/bookmark", headers=_auth(t)).status_code == 204
    assert client.post(f"/api/events/{eid}/bookmark", headers=_auth(t)).status_code == 204
    rows = client.get("/api/users/me/bookmarks/events", headers=_auth(t)).json()
    assert len(rows) == 1
    # double-unbookmark
    assert client.delete(f"/api/events/{eid}/bookmark", headers=_auth(t)).status_code == 204
    assert client.delete(f"/api/events/{eid}/bookmark", headers=_auth(t)).status_code == 204
    assert client.get("/api/users/me/bookmarks/events", headers=_auth(t)).json() == []


# ---- cancel already cancelled ----
def test_cancel_already_cancelled_is_idempotent(client):
    t, _ = _register(client, "a@b.com")
    sid = _make_session(client, remaining=2)
    rid = client.post(f"/api/sessions/{sid}/register", headers=_auth(t)).json()["id"]
    r1 = client.delete(f"/api/registrations/{rid}", headers=_auth(t))
    assert r1.status_code == 200
    assert r1.json()["status"] == "cancelled"
    # second cancel still 200, still cancelled
    r2 = client.delete(f"/api/registrations/{rid}", headers=_auth(t))
    assert r2.status_code == 200
    assert r2.json()["status"] == "cancelled"


# ---- cancel missing ----
def test_cancel_missing_registration(client):
    t, _ = _register(client, "a@b.com")
    r = client.delete("/api/registrations/9999", headers=_auth(t))
    assert r.status_code == 404


# ---- fresh-user clean state (bug #1) ----
def test_fresh_user_clean_state(client):
    t, _ = _register(client, "fresh@b.com")
    assert client.get("/api/users/me/bookmarks/events", headers=_auth(t)).json() == []
    assert client.get("/api/users/me/bookmarks/posts", headers=_auth(t)).json() == []
    assert client.get("/api/users/me/registrations", headers=_auth(t)).json() == []
    assert client.get("/api/users/me/drafts", headers=_auth(t)).json() == []


# ---- token tampering ----
def test_tampered_token_rejected(client):
    _register(client)
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer abc.def.ghi"})
    assert r.status_code == 401
