def _register(client, email="alice@ntu.edu.tw", password="secret123", name="Alice"):
    return client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name},
    )


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_register_success(client):
    r = _register(client)
    assert r.status_code == 201
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "alice@ntu.edu.tw"
    assert body["user"]["name"] == "Alice"
    assert "id" in body["user"]


def test_register_duplicate_email(client):
    _register(client)
    r = _register(client)
    assert r.status_code == 400


def test_register_invalid_email(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "secret123", "name": "X"},
    )
    assert r.status_code == 422


def test_register_short_password(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "a@b.com", "password": "123", "name": "X"},
    )
    assert r.status_code == 422


def test_login_success(client):
    _register(client)
    r = client.post(
        "/api/auth/login",
        json={"email": "alice@ntu.edu.tw", "password": "secret123"},
    )
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_login_wrong_password(client):
    _register(client)
    r = client.post(
        "/api/auth/login",
        json={"email": "alice@ntu.edu.tw", "password": "wrong"},
    )
    assert r.status_code == 401


def test_login_unknown_user(client):
    r = client.post(
        "/api/auth/login",
        json={"email": "ghost@ntu.edu.tw", "password": "whatever"},
    )
    assert r.status_code == 401


def test_me_requires_auth(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_with_token(client):
    token = _register(client).json()["access_token"]
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "alice@ntu.edu.tw"


def test_me_with_bad_token(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code == 401
