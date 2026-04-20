"""
One-time script: create a beta-tester admin user.

Usage (from the backend/ directory):
    python scripts/create_admin.py

Beta credentials:
    Email:    admin@panorama-sdg.org
    Password: Panorama2030!
    Role:     admin
"""

import sys
import os

# Add the backend root to the path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole

ADMIN_EMAIL = "admin@panorama-sdg.org"
ADMIN_PASSWORD = "Panorama2030!"


def create_admin():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"[INFO] Admin user already exists: {ADMIN_EMAIL}")
            print(f"       Role: {existing.role.value}")
            return

        admin = User(
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("=" * 50)
        print("  Admin user created successfully!")
        print("=" * 50)
        print(f"  Email:    {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
        print(f"  Role:     {admin.role.value}")
        print(f"  ID:       {admin.id}")
        print("=" * 50)
        print("  Login at: /admin/login")
        print("=" * 50)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
