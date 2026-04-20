import os
import sys
from sqlalchemy import create_engine, text
from pathlib import Path

# Load DATABASE_URL from backend/.env
env_path = Path(__file__).parent.parent / "backend" / ".env"
database_url = None

if env_path.exists():
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                database_url = line.split("=", 1)[1].strip()
                break

if not database_url:
    print("ERROR: DATABASE_URL not found in backend/.env")
    sys.exit(1)

# Ensure the URL is in a format SQLAlchemy likes (replace postgres:// with postgresql:// if needed)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(database_url)

def verify():
    try:
        with engine.connect() as conn:
            # Count projects
            res_projects = conn.execute(text("SELECT count(*) FROM projects")).fetchone()
            count_projects = res_projects[0]
            
            # Count SDG relations
            res_sdgs = conn.execute(text("SELECT count(*) FROM project_sdgs")).fetchone()
            count_sdgs = res_sdgs[0]
            
            # Count workflow statuses
            res_workflow = conn.execute(text("SELECT workflow_status, count(*) FROM projects GROUP BY workflow_status")).fetchall()
            
            print("=== VERIFICATION RESULTS ===")
            print(f"Total Projects: {count_projects}")
            print(f"Total SDG Mappings: {count_sdgs}")
            print("\nWorkflow Status Distribution:")
            for status, count in res_workflow:
                print(f"  {status}: {count}")
            
    except Exception as e:
        print(f"ERROR: Could not verify database: {e}")

if __name__ == "__main__":
    verify()
