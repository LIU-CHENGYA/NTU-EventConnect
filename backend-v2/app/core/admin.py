"""Whitelist-based admin determination.

The set of administrators is defined by a plain-text whitelist of email
addresses living in the repo (``backend-v2/admin_whitelist.txt`` by default),
NOT by the ``users.is_admin`` DB column. This lets us grant or revoke admin by
editing a committed file instead of touching the database.

An account is an admin iff its (case-insensitive) email appears in the
whitelist. Admins are the only users allowed to create events; everything else
(editing an event, viewing its registrations) is gated by event ownership,
which — since only admins can create — already restricts to admins.

Two sources are merged (either grants admin):
  1. ``ADMIN_WHITELIST`` env var — inline comma/newline separated list.
  2. ``ADMIN_WHITELIST_FILE`` — path to a txt/csv file (default
     ``admin_whitelist.txt`` resolved against the backend-v2 root).

The sources are re-read on every check so edits take effect without a restart;
both are tiny and the gated endpoints (login / create event) are low-frequency.
"""
from __future__ import annotations

from pathlib import Path

from app.core.config import settings

# app/core/admin.py -> parents[2] == backend-v2 root, independent of CWD.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _normalize(raw: str) -> set[str]:
    """Split a txt/csv blob into a set of normalized emails.

    Accepts one-per-line (txt) or comma-separated (csv / env) input; ignores
    blank lines and ``#`` comment lines; lowercases and strips each entry.

    Comment lines are dropped BEFORE comma-splitting so that a comma inside a
    comment can never leak text into the email set.
    """
    emails: set[str] = set()
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # A single line may carry a comma-separated list (csv / ADMIN_WHITELIST).
        for token in line.split(","):
            entry = token.strip().lower()
            if entry and not entry.startswith("#"):
                emails.add(entry)
    return emails


def _whitelisted_emails() -> set[str]:
    emails: set[str] = set()
    if settings.ADMIN_WHITELIST:
        emails |= _normalize(settings.ADMIN_WHITELIST)
    path = Path(settings.ADMIN_WHITELIST_FILE)
    if not path.is_absolute():
        path = _BACKEND_ROOT / path
    try:
        emails |= _normalize(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, OSError):
        pass
    return emails


def is_admin_email(email: str | None) -> bool:
    """True iff ``email`` is in the admin whitelist (case-insensitive)."""
    if not email:
        return False
    return email.strip().lower() in _whitelisted_emails()


def admin_whitelist() -> set[str]:
    """Current set of admin emails (for diagnostics / startup checks)."""
    return _whitelisted_emails()
