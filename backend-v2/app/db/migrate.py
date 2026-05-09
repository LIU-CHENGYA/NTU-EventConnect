"""Lightweight startup-time schema additions.

`Base.metadata.create_all()` creates *new* tables but does not ALTER existing
ones. Phase 2 added new columns to `posts`, so on any DB seeded before
Phase 2 those columns are missing. This module adds them in a way that is
safe for both SQLite and Postgres.

For production-grade migrations the team should adopt Alembic; this is the
minimum viable path for the 5/10 demo.
"""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


# Columns we expect on existing tables; (table, column, ddl_fragment)
EXPECTED_COLUMNS = [
    ("posts", "title",         "VARCHAR(200)"),
    ("posts", "group_id",      "INTEGER"),
    ("posts", "is_board_post", "BOOLEAN NOT NULL DEFAULT 0"),
]


def _ddl_for(dialect: str, frag: str) -> str:
    if dialect == "postgresql":
        # Postgres wants TRUE/FALSE keywords and BOOLEAN as BOOL
        return frag.replace("DEFAULT 0", "DEFAULT FALSE")
    return frag


def ensure_post_columns(engine: Engine) -> list[str]:
    """Add any missing Post columns. Returns names of columns added."""
    inspector = inspect(engine)
    if "posts" not in inspector.get_table_names():
        return []
    have = {c["name"] for c in inspector.get_columns("posts")}
    added: list[str] = []
    dialect = engine.dialect.name
    with engine.begin() as conn:
        for table, col, frag in EXPECTED_COLUMNS:
            if col in have:
                continue
            ddl = f"ALTER TABLE {table} ADD COLUMN {col} {_ddl_for(dialect, frag)}"
            conn.execute(text(ddl))
            added.append(col)
    return added


def run_startup_migrations(engine: Engine) -> None:
    """Best-effort, idempotent. Logs added columns for the operator."""
    try:
        added = ensure_post_columns(engine)
        if added:
            # Use FastAPI/uvicorn logger so it surfaces at startup
            import logging
            logging.getLogger("uvicorn").warning(
                "[migrate] Added missing posts columns: %s", ", ".join(added)
            )
    except Exception as e:  # noqa: BLE001
        import logging
        logging.getLogger("uvicorn").error("[migrate] startup migration failed: %s", e)
