import io


def _register(client, email):
    r = client.post("/api/auth/register", json={
        "email": email, "password": "secret123", "name": "U",
    })
    return r.json()["access_token"], r.json()["user"]["id"]


def _auth(t):
    return {"Authorization": f"Bearer {t}"}


# ----- users -----
def test_get_user_profile(client):
    t, uid = _register(client, "a@b.com")
    r = client.get(f"/api/users/{uid}")
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "a@b.com"
    assert body["post_count"] == 0
    assert body["joined_event_count"] == 0


def test_get_user_404(client):
    r = client.get("/api/users/9999")
    assert r.status_code == 404


def test_update_me(client):
    t, _ = _register(client, "a@b.com")
    r = client.patch("/api/users/me", headers=_auth(t), json={
        "name": "新名字", "bio": "hi", "department": "資工系",
    })
    assert r.status_code == 200
    assert r.json()["name"] == "新名字"
    assert r.json()["bio"] == "hi"
    assert r.json()["department"] == "資工系"


def test_update_me_requires_auth(client):
    r = client.patch("/api/users/me", json={"name": "x"})
    assert r.status_code == 401


def test_update_me_validation(client):
    t, _ = _register(client, "a@b.com")
    r = client.patch("/api/users/me", headers=_auth(t), json={"name": ""})
    assert r.status_code == 422


def test_profile_post_count_reflects_public_only(client):
    t, uid = _register(client, "a@b.com")
    client.post("/api/posts", headers=_auth(t), json={"content": "p1"})
    client.post("/api/posts", headers=_auth(t), json={"content": "p2"})
    client.post("/api/posts", headers=_auth(t), json={"content": "draft", "visibility": "private"})
    body = client.get(f"/api/users/{uid}").json()
    assert body["post_count"] == 2


# ----- uploads -----
def _png_bytes() -> bytes:
    # Minimal valid PNG header bytes (just a few bytes is enough — server doesn't validate content)
    return b"\x89PNG\r\n\x1a\n" + b"0" * 100


def test_upload_image(client):
    t, _ = _register(client, "a@b.com")
    r = client.post(
        "/api/uploads",
        headers=_auth(t),
        files={"file": ("a.png", io.BytesIO(_png_bytes()), "image/png")},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["url"].startswith("/uploads/")
    assert body["url"].endswith(".png")
    assert body["size"] > 0


def test_upload_requires_auth(client):
    r = client.post(
        "/api/uploads",
        files={"file": ("a.png", io.BytesIO(_png_bytes()), "image/png")},
    )
    assert r.status_code == 401


def test_upload_disallowed_ext(client):
    t, _ = _register(client, "a@b.com")
    r = client.post(
        "/api/uploads",
        headers=_auth(t),
        files={"file": ("evil.exe", io.BytesIO(b"x" * 10), "application/octet-stream")},
    )
    assert r.status_code == 400


def test_upload_empty(client):
    t, _ = _register(client, "a@b.com")
    r = client.post(
        "/api/uploads",
        headers=_auth(t),
        files={"file": ("a.png", io.BytesIO(b""), "image/png")},
    )
    assert r.status_code == 400


def test_upload_too_large(client):
    t, _ = _register(client, "a@b.com")
    big = b"0" * (5 * 1024 * 1024 + 1)
    r = client.post(
        "/api/uploads",
        headers=_auth(t),
        files={"file": ("a.png", io.BytesIO(big), "image/png")},
    )
    assert r.status_code == 400
