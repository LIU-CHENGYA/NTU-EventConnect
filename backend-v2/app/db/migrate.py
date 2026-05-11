"""Lightweight startup-time schema additions.

`Base.metadata.create_all()` creates *new* tables but does not ALTER existing
ones. Phase 2 added new columns to `posts`; Phase 2.1 added `official_category`
to `events`. On any DB seeded before these columns existed, ALTER is required.
This module adds them in a way that is safe for both SQLite and Postgres.

For production-grade migrations the team should adopt Alembic; this is the
minimum viable path for the demo.
"""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


# Columns we expect on existing tables; (table, column, ddl_fragment)
EXPECTED_COLUMNS = [
    ("posts",  "title",             "VARCHAR(200)"),
    ("posts",  "group_id",          "INTEGER"),
    ("posts",  "is_board_post",     "BOOLEAN NOT NULL DEFAULT 0"),
    ("events", "official_category", "VARCHAR(500)"),
    # English variants seeded from fetch_data/csv/events_en.csv. Nullable; API
    # falls back to ZH when absent.
    ("events",         "title_en",              "VARCHAR(500)"),
    ("events",         "content_en",            "TEXT"),
    ("events",         "category_en",           "VARCHAR(100)"),
    ("events",         "official_category_en",  "VARCHAR(500)"),
    ("events",         "organizer_en",          "VARCHAR(500)"),
    ("events",         "registration_type_en",  "VARCHAR(100)"),
    ("events",         "registration_fee_en",   "VARCHAR(100)"),
    ("events",         "target_audience_en",    "VARCHAR(500)"),
    ("events",         "restrictions_en",       "VARCHAR(500)"),
    ("events",         "learning_category_en",  "VARCHAR(100)"),
    ("event_sessions", "session_name_en",       "VARCHAR(500)"),
    ("event_sessions", "session_content_en",    "TEXT"),
    ("event_sessions", "instructor_en",         "VARCHAR(500)"),
    ("event_sessions", "location_en",           "VARCHAR(300)"),
    ("event_sessions", "meal_en",               "VARCHAR(100)"),
]


def _ddl_for(dialect: str, frag: str) -> str:
    if dialect == "postgresql":
        # Postgres wants TRUE/FALSE keywords and BOOLEAN as BOOL
        return frag.replace("DEFAULT 0", "DEFAULT FALSE")
    return frag


def ensure_columns(engine: Engine) -> list[str]:
    """Add any missing columns across known tables. Returns full names added (table.column)."""
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    added: list[str] = []
    dialect = engine.dialect.name

    # Group expected columns by table so we only inspect each table once.
    by_table: dict[str, list[tuple[str, str]]] = {}
    for table, col, frag in EXPECTED_COLUMNS:
        by_table.setdefault(table, []).append((col, frag))

    with engine.begin() as conn:
        for table, cols in by_table.items():
            if table not in table_names:
                continue
            have = {c["name"] for c in inspector.get_columns(table)}
            for col, frag in cols:
                if col in have:
                    continue
                ddl = f"ALTER TABLE {table} ADD COLUMN {col} {_ddl_for(dialect, frag)}"
                conn.execute(text(ddl))
                added.append(f"{table}.{col}")
    return added


# Backwards-compat alias: older code paths called ensure_post_columns explicitly.
ensure_post_columns = ensure_columns


# Postgres-only column-type widenings. SQLite ignores VARCHAR length so the
# widening is a no-op there; Postgres enforces it and rejected the 2026-05-11
# seed when EN parent-activity names exceeded 100 chars (max observed 247).
# Each entry is (table, column, target_length). Skipped when the live column
# is already at or above target_length so re-startups stay quiet.
EXPECTED_WIDENINGS = [
    ("events", "official_category",    500),
    ("events", "official_category_en", 500),
    # 2026-05-11 #2: events_en.csv の organizer_unit / instructor が翻訳後
    # 200 文字を超え seed 失敗。ZH 側も対称に拡げる。
    ("events",         "organizer",     500),
    ("events",         "organizer_en",  500),
    ("event_sessions", "instructor",    500),
    ("event_sessions", "instructor_en", 500),
]


def widen_columns(engine: Engine) -> list[str]:
    """Grow VARCHAR widths on Postgres only. Returns list of altered columns."""
    if engine.dialect.name != "postgresql":
        return []
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    altered: list[str] = []
    with engine.begin() as conn:
        for table, col, target_len in EXPECTED_WIDENINGS:
            if table not in table_names:
                continue
            current = next(
                (c for c in inspector.get_columns(table) if c["name"] == col),
                None,
            )
            if current is None:
                continue
            cur_len = getattr(current.get("type"), "length", None)
            if cur_len is not None and cur_len >= target_len:
                continue
            conn.execute(
                text(f"ALTER TABLE {table} ALTER COLUMN {col} TYPE VARCHAR({target_len})")
            )
            altered.append(f"{table}.{col} -> VARCHAR({target_len})")
    return altered


def run_startup_migrations(engine: Engine) -> None:
    """Idempotent. ADD COLUMN failures stay best-effort; column-widening
    failures are fatal so the 02:00 cron cannot silently repeat the
    2026-05-11 VARCHAR(100) overflow regression.
    """
    import logging
    log = logging.getLogger("uvicorn")
    try:
        added = ensure_columns(engine)
        if added:
            log.warning("[migrate] Added missing columns: %s", ", ".join(added))
    except Exception as e:  # noqa: BLE001
        log.error("[migrate] ensure_columns failed: %s", e)
    altered = widen_columns(engine)
    if altered:
        log.warning("[migrate] Widened columns: %s", ", ".join(altered))
