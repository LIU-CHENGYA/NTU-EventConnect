from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


_is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if _is_sqlite else {}
# pool_pre_ping 對遠端 Postgres 很重要：閒置連線被防火牆/雲端 NAT 砍掉時，
# 取出來前會先送一個輕量 SELECT 1 確認還活著，避免拿到死連線後才報錯。
_pg_pool_kwargs = {} if _is_sqlite else {
    "pool_size": 10,       # keep 10 persistent connections ready
    "max_overflow": 20,    # allow burst up to 30 total
    "pool_timeout": 30,    # raise after 30 s if no connection free
    "pool_recycle": 1800,  # recycle connections after 30 min to avoid NAT timeout drops
}
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    future=True,
    pool_pre_ping=not _is_sqlite,
    **_pg_pool_kwargs,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
