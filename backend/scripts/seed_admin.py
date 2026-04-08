"""Create or update an admin user.

Usage:
    python -m scripts.seed_admin
"""
from __future__ import annotations
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.db.session import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.core.security import hash_password  # noqa: E402

ADMIN_EMAIL = "admin@ntu.edu.tw"
ADMIN_PASSWORD = "Admin123!"
ADMIN_NAME = "Admin"


def main() -> None:
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if u:
            u.password_hash = hash_password(ADMIN_PASSWORD)
            u.is_admin = True
            u.name = ADMIN_NAME
            print(f"[OK] updated admin {ADMIN_EMAIL}")
        else:
            u = User(
                email=ADMIN_EMAIL,
                name=ADMIN_NAME,
                password_hash=hash_password(ADMIN_PASSWORD),
                is_admin=True,
            )
            db.add(u)
            print(f"[OK] created admin {ADMIN_EMAIL}")
        db.commit()
        print(f"     password = {ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
