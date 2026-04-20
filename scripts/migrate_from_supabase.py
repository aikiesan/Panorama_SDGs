"""
Migrate all data from Supabase (source) to a local PostgreSQL database (destination).

Usage:
    LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/panorama_sdg" \
        python scripts/migrate_from_supabase.py

The script reads DATABASE_URL from backend/.env as the source (Supabase).
Set LOCAL_DATABASE_URL in the environment for the destination.
"""
import os
import sys
from pathlib import Path

# Load backend .env
env_file = Path(__file__).parent.parent / "backend" / ".env"
for line in env_file.read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

LOCAL_DATABASE_URL = os.environ.get("LOCAL_DATABASE_URL")
if not LOCAL_DATABASE_URL:
    print("ERROR: Set LOCAL_DATABASE_URL env var to the local postgres connection string.")
    print("  Example: LOCAL_DATABASE_URL=postgresql://postgres:secret@localhost:5432/panorama_sdg")
    sys.exit(1)

SOURCE_DATABASE_URL = os.environ["DATABASE_URL"]
print(f"Source : {SOURCE_DATABASE_URL.split('@')[1]}")  # hide credentials
print(f"Dest   : {LOCAL_DATABASE_URL.split('@')[1]}")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path so models import correctly
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
from app.models.user import User, Base as UserBase
from app.models.project import (
    Project, ProjectSDG, ProjectTypology,
    ProjectRequirement, ProjectImage, Base as ProjectBase
)
from app.core.database import Base


# Source engine (Supabase Transaction Pooler - no pool_pre_ping needed for one-off script)
src_engine = create_engine(SOURCE_DATABASE_URL, pool_pre_ping=True)

# Destination engine (local postgres, plain connection)
dst_engine = create_engine(LOCAL_DATABASE_URL)

SrcSession = sessionmaker(bind=src_engine)
DstSession = sessionmaker(bind=dst_engine)

print("\nCreating schema on destination...")
Base.metadata.create_all(dst_engine)
print("Schema ready.")

src = SrcSession()
dst = DstSession()

TABLES = [
    ("users",       User),
    ("projects",    Project),
    ("project_sdgs",        ProjectSDG),
    ("project_typologies",  ProjectTypology),
    ("project_requirements",ProjectRequirement),
    ("project_images",      ProjectImage),
]

try:
    for table_name, Model in TABLES:
        rows = src.query(Model).all()
        print(f"  {table_name}: {len(rows)} rows", end="", flush=True)

        # Detach from source session and add to destination
        for row in rows:
            src.expunge(row)
            dst.merge(row)

        dst.flush()
        print(" ... done")

    dst.commit()
    print("\nMigration complete!")

except Exception as e:
    dst.rollback()
    print(f"\nERROR: {e}")
    raise

finally:
    src.close()
    dst.close()
