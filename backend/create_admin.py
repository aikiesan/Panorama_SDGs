#!/usr/bin/env python3
"""
Create the first Admin user for Atlas 3+3.
"""

import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        email = "admin@atlas.org"
        password = "admin"  # Change this in production!

        # Check if exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"Admin user {email} already exists.")
            return

        print(f"Creating admin user: {email}")
        
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role=UserRole.ADMIN
        )
        
        db.add(user)
        db.commit()
        print("Successfully created admin user.")
        print(f"Email: {email}")
        print(f"Password: {password}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
