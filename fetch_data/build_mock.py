"""
Step A ETL: events.csv -> frontend/src/mock/events.generated.json

讀 fetch_data/csv/events.csv，解析欄位、過濾「未來且仍有名額」的場次，
產出符合前端 mockEvents shape 的 JSON。

只用 stdlib，沒有外部依賴。
"""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "fetch_data" / "csv" / "events.csv"
OUT_PATH = ROOT / "frontend" / "src" / "mock" / "events.generated.json"

# 上限筆數，避免一次塞太多進前端 bundle
MAX_EVENTS = 200

# 依 activity_type / learning_category 對應預設圖
DEFAULT_IMAGES = {
    "講座": "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800",
    "課程": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    "工作坊": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
    "研習": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
    "活動": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    "比賽": "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
    "展覽": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800",
    "演唱會": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
}
FALLBACK_IMAGE = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800"


def pick_image(activity_type: str) -> str:
    if not activity_type:
        return FALLBACK_IMAGE
    for key, url in DEFAULT_IMAGES.items():
        if key in activity_type:
            return url
    return FALLBACK_IMAGE


def parse_int_with_unit(s: str) -> int | None:
    if not s:
        return None
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else None


_DATETIME_RE = re.compile(
    r"(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})(?::\d{2})?"
)


def parse_session_time(s: str) -> tuple[str, str, str]:
    """
    Returns (date, time_range, raw)
    e.g. "2026-06-08 12:20:00 ~ 14:00:00" -> ("2026-06-08", "12:20 - 14:00", raw)
         "2026-05-26 17:15:00 ~ 2026-05-27 21:15:00" -> ("2026-05-26", "17:15 - 21:15 (跨日)", raw)
    """
    if not s:
        return ("", "", "")
    parts = [p.strip() for p in s.split("~")]
    if len(parts) != 2:
        m = _DATETIME_RE.search(s)
        if m:
            return (m.group(1), m.group(2), s)
        return ("", "", s)

    m1 = _DATETIME_RE.search(parts[0])
    if not m1:
        return ("", "", s)
    d1, t1 = m1.group(1), m1.group(2)

    # 第二段可能只有 time
    m2_full = _DATETIME_RE.search(parts[1])
    if m2_full:
        d2, t2 = m2_full.group(1), m2_full.group(2)
        if d2 == d1:
            return (d1, f"{t1} - {t2}", s)
        return (d1, f"{t1} - {t2} (~{d2})", s)

    m2_time = re.search(r"(\d{2}:\d{2})", parts[1])
    if m2_time:
        return (d1, f"{t1} - {m2_time.group(1)}", s)
    return (d1, t1, s)


def parse_registration_time(s: str) -> tuple[str, str]:
    """Returns (start, end) as 'YYYY-MM-DD HH:MM' strings."""
    if not s:
        return ("", "")
    parts = [p.strip() for p in s.split("~")]
    if len(parts) != 2:
        return ("", "")

    def fmt(part: str) -> str:
        m = _DATETIME_RE.search(part)
        if not m:
            return ""
        return f"{m.group(1)} {m.group(2)}"

    return (fmt(parts[0]), fmt(parts[1]))


def parse_organizer_contact(s: str) -> tuple[str, str, str]:
    """name; phone; email -> (name, phone, email). 任一缺漏回空字串."""
    if not s:
        return ("", "", "")
    parts = [p.strip() for p in s.split(";")]
    name = parts[0] if len(parts) > 0 else ""
    phone = ""
    email = ""
    for p in parts[1:]:
        if "@" in p:
            email = p
        elif re.search(r"\d", p):
            phone = p
    return (name, phone, email)


def is_future(date_str: str) -> bool:
    if not date_str:
        return False
    try:
        return datetime.strptime(date_str, "%Y-%m-%d") >= datetime(2026, 1, 1)
    except ValueError:
        return False


def normalize_none(val: str) -> str:
    """把「無」「None」之類視為空字串。"""
    if not val:
        return ""
    v = val.strip()
    if v in ("無", "None", "-", "—"):
        return ""
    return v


def build():
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    events = []
    next_id = 1

    for row in rows:
        date, time_range, raw_session = parse_session_time(row.get("session_time", ""))
        if not is_future(date):
            continue

        capacity = parse_int_with_unit(row.get("capacity", ""))
        remaining = parse_int_with_unit(row.get("remaining_slots", ""))
        if remaining is not None and remaining <= 0:
            continue

        reg_start, reg_end = parse_registration_time(row.get("registration_time", ""))
        contact_name, contact_phone, contact_email = parse_organizer_contact(
            row.get("organizer_contact", "")
        )

        title = (
            row.get("activity_name_event_page")
            or row.get("activity_name_activity_session")
            or "(無標題)"
        ).strip()

        category = (row.get("activity_type") or "").strip()
        # 去掉「(...)」尾巴讓分類更乾淨
        category_clean = re.sub(r"\s*\([^)]*\)\s*$", "", category)

        events.append({
            "id": next_id,
            "title": title,
            "sessionName": (row.get("session_name") or "").strip(),
            "content": (row.get("session_content") or row.get("activity_content") or "").strip(),
            "activityContent": (row.get("activity_content") or "").strip(),
            "instructor": (row.get("instructor") or "").strip(),
            "category": category_clean or "活動",
            "image": pick_image(category),
            "date": date,
            "time": time_range,
            "rawSessionTime": raw_session,
            "location": (row.get("location") or "").strip(),
            "organizer": (row.get("organizer_unit") or "").strip(),
            "organizerContact": contact_name,
            "contactPhone": contact_phone,
            "contactEmail": contact_email,
            "registrationStart": reg_start,
            "registrationEnd": reg_end,
            "registrationType": (row.get("registration_type") or "").strip(),
            "registrationFee": (row.get("registration_fee") or "").strip(),
            "targetAudience": (row.get("target_audience") or "").strip(),
            "restrictions": normalize_none(row.get("other_restrictions", ""))
                or normalize_none(row.get("activity_limit", "")),
            "capacity": capacity if capacity is not None else 0,
            "remainingSlots": remaining if remaining is not None else 0,
            "meal": normalize_none(row.get("meal", "")),
            "civilServantHours": normalize_none(row.get("civil_servant_hours", "")),
            "studyHours": normalize_none(row.get("study_hours", "")),
            "learningCategory": (row.get("learning_category") or row.get("life_learning_type") or "").strip(),
            "city": (row.get("city") or "").strip() or "台北市",
            "outsideUrl": normalize_none(row.get("outside_url", "")),
            "attachment": normalize_none(row.get("attachment", "")),
            "note": normalize_none(row.get("note", "")),
            "eventUrl": (row.get("event_url") or "").strip(),
            "parentUrl": (row.get("parent_url") or "").strip(),
            "rating": 0,
            "reviewCount": 0,
        })
        next_id += 1
        if len(events) >= MAX_EVENTS:
            break

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)

    print(f"[OK] wrote {len(events)} events -> {OUT_PATH}")
    if events:
        sample = events[0]
        print(f"     sample: {sample['title']} | {sample['date']} {sample['time']}")


if __name__ == "__main__":
    build()
