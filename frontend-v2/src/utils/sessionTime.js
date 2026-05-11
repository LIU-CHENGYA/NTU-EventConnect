// Frontend mirror of backend `app/core/time.py:parse_session_end`.
// Session times are scheduled in Asia/Taipei (UTC+8); we compute the end in
// that local timezone and compare against the user's "now".

const TPE_OFFSET_MIN = 8 * 60;

function _localTpe(dateStr, timeStr) {
  // Build an absolute instant from a Taipei wall-clock "YYYY-MM-DD HH:MM:SS".
  const d = (dateStr || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!d) return null;
  const t = (timeStr || "").match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!t) return null;
  const utcMs = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2], t[3] ? +t[3] : 0);
  return new Date(utcMs - TPE_OFFSET_MIN * 60 * 1000);
}

export function parseSessionEnd(session) {
  if (!session) return null;
  const raw = (session.raw_session_time || "").trim();
  let leftDate = "";
  let right = "";
  if (raw.includes(" ~ ")) {
    const [l, r] = raw.split(" ~ ");
    leftDate = (l || "").split(" ")[0];
    right = (r || "").trim();
  }

  // Case 1: right side has its own date (multi-day range).
  if (right && right.includes("-")) {
    const parts = right.split(" ");
    const d = parts[0];
    const t = parts.slice(1).join(" ").trim();
    const end = _localTpe(d, t);
    if (end) return end;
  }
  // Case 2: right side is time-only; combine with left date or session.date.
  if (right && !right.includes("-")) {
    const date = leftDate || (session.date || "").trim();
    if (date) {
      const end = _localTpe(date, right);
      if (end) return end;
    }
  }
  // Case 3: fall back to session.date + end-of time_range ("12:20:00 ~ 14:00:00").
  const tr = (session.time_range || "").trim();
  const date = (session.date || "").trim();
  if (date && tr && tr.includes(" ~ ")) {
    const endTime = tr.split(" ~ ")[1].trim();
    const end = _localTpe(date, endTime);
    if (end) return end;
  }
  // Last resort: date + 23:59:59 in Taipei.
  if (date) {
    const end = _localTpe(date, "23:59:59");
    if (end) return end;
  }
  return null;
}

export function sessionHasEnded(session, now = new Date()) {
  // Fail-safe: unparseable session is treated as not-ended (matches backend).
  const end = parseSessionEnd(session);
  if (!end) return false;
  return now.getTime() >= end.getTime();
}

export function eventHasFutureSession(event, now = new Date()) {
  const sessions = (event && event.sessions) || [];
  if (sessions.length === 0) return true;
  return sessions.some((s) => !sessionHasEnded(s, now));
}
