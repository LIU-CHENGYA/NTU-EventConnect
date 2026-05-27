"""Whitelist-based admin gate.

Only emails listed in the admin whitelist are admins, and only admins may
create or manage events. See app/core/admin.py.
"""
import pytest

from app.core.config import settings


def _register(client, email, password="secret123", name="U"):
    r = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name},
    )
    assert r.status_code == 201, r.text
    return r.json()


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def whitelist(monkeypatch):
    """Make admin@ntu.edu.tw the sole admin for the duration of a test.

    Points the file source at a nonexistent path so only the inline list
    applies — keeps the test independent of the committed admin_whitelist.txt.
    """
    monkeypatch.setattr(settings, "ADMIN_WHITELIST", "admin@ntu.edu.tw")
    monkeypatch.setattr(settings, "ADMIN_WHITELIST_FILE", "/nonexistent/admin_whitelist.txt")


def test_whitelisted_user_is_admin_and_can_create_event(client, whitelist):
    body = _register(client, "admin@ntu.edu.tw")
    assert body["user"]["is_admin"] is True
    r = client.post(
        "/api/events", json={"title": "Admin Event"}, headers=_auth(body["access_token"])
    )
    assert r.status_code == 201, r.text
    assert r.json()["title"] == "Admin Event"


def test_non_whitelisted_user_is_not_admin_and_cannot_create_event(client, whitelist):
    body = _register(client, "alice@ntu.edu.tw")
    assert body["user"]["is_admin"] is False
    r = client.post(
        "/api/events", json={"title": "Regular User Event"}, headers=_auth(body["access_token"])
    )
    assert r.status_code == 403, r.text


def test_whitelist_match_is_case_insensitive(client, whitelist):
    # Mixed-case local part vs lowercase whitelist entry still matches.
    body = _register(client, "Admin@ntu.edu.tw")
    assert body["user"]["is_admin"] is True


def test_me_endpoint_reflects_whitelist(client, whitelist):
    token = _register(client, "admin@ntu.edu.tw")["access_token"]
    r = client.get("/api/auth/me", headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["is_admin"] is True


def test_comment_with_commas_does_not_pollute_whitelist(tmp_path, monkeypatch):
    # Regression: comment lines (incl. commas) must never leak into the set.
    f = tmp_path / "admin_whitelist.txt"
    f.write_text(
        "# One per line, commas are fine in comments, and so is, this.\n"
        "# Security note: register first, then add the email here.\n"
        "\n"
        "real@ntu.edu.tw\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(settings, "ADMIN_WHITELIST", "")
    monkeypatch.setattr(settings, "ADMIN_WHITELIST_FILE", str(f))
    from app.core.admin import admin_whitelist, is_admin_email

    assert admin_whitelist() == {"real@ntu.edu.tw"}
    assert is_admin_email("real@ntu.edu.tw") is True
    assert is_admin_email("and") is False


def test_inline_env_comma_list_is_parsed(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_WHITELIST", "a@x.com, B@Y.com")
    monkeypatch.setattr(settings, "ADMIN_WHITELIST_FILE", "/nonexistent/admin_whitelist.txt")
    from app.core.admin import admin_whitelist

    assert admin_whitelist() == {"a@x.com", "b@y.com"}


def test_non_admin_cannot_manage_events(client, whitelist):
    """Editing / listing managed events / viewing registrations are admin-only,
    so a legacy non-admin owner is locked out even on their own events."""
    admin_token = _register(client, "admin@ntu.edu.tw")["access_token"]
    created = client.post(
        "/api/events", json={"title": "Admin Event"}, headers=_auth(admin_token)
    )
    assert created.status_code == 201, created.text
    event_id = created.json()["id"]

    alice = _register(client, "alice@ntu.edu.tw")["access_token"]
    assert client.get(
        "/api/users/me/managed_events", headers=_auth(alice)
    ).status_code == 403
    assert client.get(
        f"/api/events/{event_id}/registrations", headers=_auth(alice)
    ).status_code == 403
    assert client.patch(
        f"/api/events/{event_id}", json={"title": "hacked"}, headers=_auth(alice)
    ).status_code == 403
