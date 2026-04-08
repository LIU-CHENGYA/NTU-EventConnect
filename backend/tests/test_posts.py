from app.models.event import Event


def _register(client, email, name="U"):
    r = client.post("/api/auth/register", json={
        "email": email, "password": "secret123", "name": name,
    })
    return r.json()["access_token"], r.json()["user"]["id"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _create_event(client):
    db = client.db_factory()
    try:
        e = Event(source_url="http://x/p1", title="活動", category="講座")
        db.add(e); db.commit(); db.refresh(e)
        return e.id
    finally:
        db.close()


# ----- posts CRUD -----
def test_create_post_requires_auth(client):
    r = client.post("/api/posts", json={"content": "x"})
    assert r.status_code == 401


def test_create_and_get_post(client):
    token, uid = _register(client, "a@b.com")
    eid = _create_event(client)
    r = client.post("/api/posts", headers=_auth(token), json={
        "event_id": eid, "rating": 5, "content": "好棒",
        "images": ["http://i/1"], "visibility": "public",
    })
    assert r.status_code == 201
    pid = r.json()["id"]
    assert r.json()["user_id"] == uid

    r = client.get(f"/api/posts/{pid}")
    assert r.status_code == 200
    body = r.json()
    assert body["content"] == "好棒"
    assert body["images"] == ["http://i/1"]
    assert body["like_count"] == 0
    assert body["comments"] == []


def test_post_validation(client):
    token, _ = _register(client, "a@b.com")
    r = client.post("/api/posts", headers=_auth(token), json={"content": ""})
    assert r.status_code == 422
    r = client.post("/api/posts", headers=_auth(token), json={"content": "x", "rating": 99})
    assert r.status_code == 422
    r = client.post("/api/posts", headers=_auth(token), json={"content": "x", "visibility": "weird"})
    assert r.status_code == 422


def test_list_posts_filters(client):
    t1, u1 = _register(client, "a@b.com")
    t2, u2 = _register(client, "b@b.com")
    eid = _create_event(client)
    client.post("/api/posts", headers=_auth(t1), json={"content": "p1", "event_id": eid})
    client.post("/api/posts", headers=_auth(t2), json={"content": "p2", "event_id": eid})
    client.post("/api/posts", headers=_auth(t1), json={"content": "draft", "visibility": "private"})

    assert len(client.get("/api/posts").json()) == 2  # public only by default
    assert len(client.get("/api/posts", params={"user_id": u1}).json()) == 1
    assert len(client.get("/api/posts", params={"event_id": eid}).json()) == 2
    assert len(client.get("/api/posts", params={"visibility": "private", "user_id": u1}).json()) == 1


def test_update_post_owner_only(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    pid = client.post("/api/posts", headers=_auth(t1), json={"content": "x"}).json()["id"]

    r = client.patch(f"/api/posts/{pid}", headers=_auth(t2), json={"content": "hack"})
    assert r.status_code == 403

    r = client.patch(f"/api/posts/{pid}", headers=_auth(t1), json={"content": "edited", "rating": 4})
    assert r.status_code == 200
    assert r.json()["content"] == "edited"
    assert r.json()["rating"] == 4


def test_delete_post(client):
    t1, _ = _register(client, "a@b.com")
    pid = client.post("/api/posts", headers=_auth(t1), json={"content": "x"}).json()["id"]
    assert client.delete(f"/api/posts/{pid}", headers=_auth(t1)).status_code == 204
    assert client.get(f"/api/posts/{pid}").status_code == 404


def test_delete_post_not_owner(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    pid = client.post("/api/posts", headers=_auth(t1), json={"content": "x"}).json()["id"]
    assert client.delete(f"/api/posts/{pid}", headers=_auth(t2)).status_code == 403


# ----- comments -----
def test_add_comment_then_show_in_detail(client):
    t1, u1 = _register(client, "a@b.com")
    t2, u2 = _register(client, "b@b.com")
    pid = client.post("/api/posts", headers=_auth(t1), json={"content": "x"}).json()["id"]

    r = client.post(f"/api/posts/{pid}/comments", headers=_auth(t2), json={"content": "good!"})
    assert r.status_code == 201
    cid = r.json()["id"]

    body = client.get(f"/api/posts/{pid}").json()
    assert len(body["comments"]) == 1
    assert body["comments"][0]["content"] == "good!"
    assert body["comments"][0]["user_id"] == u2

    # delete by non-owner of comment
    assert client.delete(f"/api/comments/{cid}", headers=_auth(t1)).status_code == 403
    # delete by owner
    assert client.delete(f"/api/comments/{cid}", headers=_auth(t2)).status_code == 204
    body = client.get(f"/api/posts/{pid}").json()
    assert body["comments"] == []


def test_comment_on_missing_post(client):
    t, _ = _register(client, "a@b.com")
    r = client.post("/api/posts/9999/comments", headers=_auth(t), json={"content": "x"})
    assert r.status_code == 404


# ----- likes -----
def test_like_idempotent_and_unlike(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    pid = client.post("/api/posts", headers=_auth(t1), json={"content": "x"}).json()["id"]

    assert client.post(f"/api/posts/{pid}/like", headers=_auth(t2)).status_code == 204
    assert client.post(f"/api/posts/{pid}/like", headers=_auth(t2)).status_code == 204  # idempotent
    assert client.get(f"/api/posts/{pid}").json()["like_count"] == 1

    assert client.delete(f"/api/posts/{pid}/like", headers=_auth(t2)).status_code == 204
    assert client.get(f"/api/posts/{pid}").json()["like_count"] == 0
    # unlike when not liked is fine
    assert client.delete(f"/api/posts/{pid}/like", headers=_auth(t2)).status_code == 204


def test_like_missing_post(client):
    t, _ = _register(client, "a@b.com")
    assert client.post("/api/posts/9999/like", headers=_auth(t)).status_code == 404


# ----- bookmarks -----
def test_bookmark_post_and_list(client):
    t1, _ = _register(client, "a@b.com")
    t2, _ = _register(client, "b@b.com")
    pid = client.post("/api/posts", headers=_auth(t1), json={"content": "x"}).json()["id"]

    assert client.post(f"/api/posts/{pid}/bookmark", headers=_auth(t2)).status_code == 204
    assert client.post(f"/api/posts/{pid}/bookmark", headers=_auth(t2)).status_code == 204
    rows = client.get("/api/users/me/bookmarks/posts", headers=_auth(t2)).json()
    assert len(rows) == 1 and rows[0]["id"] == pid

    assert client.delete(f"/api/posts/{pid}/bookmark", headers=_auth(t2)).status_code == 204
    assert client.get("/api/users/me/bookmarks/posts", headers=_auth(t2)).json() == []


def test_bookmark_event_and_list(client):
    t, _ = _register(client, "a@b.com")
    eid = _create_event(client)
    assert client.post(f"/api/events/{eid}/bookmark", headers=_auth(t)).status_code == 204
    rows = client.get("/api/users/me/bookmarks/events", headers=_auth(t)).json()
    assert len(rows) == 1 and rows[0]["id"] == eid

    assert client.delete(f"/api/events/{eid}/bookmark", headers=_auth(t)).status_code == 204
    assert client.get("/api/users/me/bookmarks/events", headers=_auth(t)).json() == []


def test_bookmark_missing_event(client):
    t, _ = _register(client, "a@b.com")
    assert client.post("/api/events/9999/bookmark", headers=_auth(t)).status_code == 404


def test_new_user_has_no_bookmarks(client):
    """確認註冊新帳號不會莫名其妙有收藏（前端原 bug 的後端對應防呆）"""
    t, _ = _register(client, "fresh@b.com")
    assert client.get("/api/users/me/bookmarks/events", headers=_auth(t)).json() == []
    assert client.get("/api/users/me/bookmarks/posts", headers=_auth(t)).json() == []
    assert client.get("/api/users/me/drafts", headers=_auth(t)).json() == []


def test_drafts_listing(client):
    t, _ = _register(client, "a@b.com")
    client.post("/api/posts", headers=_auth(t), json={"content": "p1"})
    client.post("/api/posts", headers=_auth(t), json={"content": "draft", "visibility": "private"})
    drafts = client.get("/api/users/me/drafts", headers=_auth(t)).json()
    assert len(drafts) == 1
    assert drafts[0]["visibility"] == "private"


def test_is_liked_is_bookmarked_flags_anon(client):
    """anon GET /posts/{id} 不帶 token 時 flags 為 false"""
    t, _ = _register(client, "a@b.com")
    pid = client.post("/api/posts", headers=_auth(t), json={"content": "x"}).json()["id"]
    body = client.get(f"/api/posts/{pid}").json()
    assert body["is_liked"] is False
    assert body["is_bookmarked"] is False
