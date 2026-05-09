from datetime import datetime, timezone, timedelta
from typing import Optional

from app.models.event import EventSession


_TPE = timezone(timedelta(hours=8))  # NTU activities are scheduled in Asia/Taipei


def _try_parse(s: str, fmts: list[str]) -> Optional[datetime]:
    for f in fmts:
        try:
            return datetime.strptime(s, f)
        except ValueError:
            continue
    return None


def parse_session_end(sess: EventSession) -> Optional[datetime]:
    """Return the session end as a tz-aware UTC datetime, or None if unparseable.

    Source data shapes seen in fetch_data/csv:
      "2026-06-08 12:20:00 ~ 14:00:00"                 (same day)
      "2026-05-26 17:15:00 ~ 2026-05-27 21:15:00"      (multi-day)
    """
    raw = (sess.raw_session_time or "").strip()
    if " ~ " in raw:
        left, right = raw.split(" ~ ", 1)
    elif raw:
        # No range separator — treat as start only; fall back to date+time_range
        left, right = raw, ""
    else:
        left, right = "", ""

    naive: Optional[datetime] = None
    if right:
        # right side may be "HH:MM:SS" or "YYYY-MM-DD HH:MM:SS"
        if "-" in right:
            naive = _try_parse(right, ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"])
        else:
            # combine with date from left
            left_date = left.split(" ", 1)[0] if left else (sess.date or "")
            if left_date:
                naive = _try_parse(
                    f"{left_date} {right}", ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"]
                )

    if naive is None:
        # fall back: date + end portion of time_range ("12:20:00 ~ 14:00:00")
        date_part = (sess.date or "").strip()
        tr = (sess.time_range or "").strip()
        if date_part and tr and " ~ " in tr:
            end = tr.split(" ~ ", 1)[1].strip()
            naive = _try_parse(
                f"{date_part} {end}", ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"]
            )
        elif date_part:
            # last resort: end of day
            naive = _try_parse(f"{date_part} 23:59:59", ["%Y-%m-%d %H:%M:%S"])

    if naive is None:
        return None
    return naive.replace(tzinfo=_TPE).astimezone(timezone.utc)


def session_has_ended(sess: EventSession) -> bool:
    """True only when we can prove the session ended. Unparseable → False (fail-safe)."""
    end = parse_session_end(sess)
    if end is None:
        return False
    return datetime.now(timezone.utc) >= end
