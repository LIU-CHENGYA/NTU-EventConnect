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
    ("events", "official_category", "VARCHAR(100)"),
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


def run_startup_migrations(engine: Engine) -> None:
    """Best-effort, idempotent. Logs added columns for the operator."""
    try:
        added = ensure_columns(engine)
        if added:
            import logging
            logging.getLogger("uvicorn").warning(
                "[migrate] Added missing columns: %s", ", ".join(added)
            )
    except Exception as e:  # noqa: BLE001
        import logging
        logging.getLogger("uvicorn").error("[migrate] startup migration failed: %s", e)
