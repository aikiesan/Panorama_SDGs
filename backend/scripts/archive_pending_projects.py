"""
Archive the current pending review queue.

Projects that were submitted to the UIA Guidebook process but not selected are
stored with workflow_status = SUBMITTED (and still shown on the public map as
"community" markers). This script flags the current pending queue
(SUBMITTED / IN_REVIEW) as archived so the admin review queue starts clean for
future submissions.

It does NOT change workflow_status and does NOT remove anything from the public
map — `is_archived` only hides a project from the admin review queue.

Usage:
    # Dry run — shows what would change
    python scripts/archive_pending_projects.py

    # Apply
    python scripts/archive_pending_projects.py --apply

Safe to re-run (idempotent): only un-archived SUBMITTED/IN_REVIEW rows are affected.
If the count shows 0 on a second run, the queue is already clear.
"""
import os
import sys
import argparse
import psycopg2


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply the archive update to the DB")
    args = parser.parse_args()

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        sys.exit("DATABASE_URL not set")

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Ensure the column exists (no-op if the Alembic migration already added it).
    cur.execute("""
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false
    """)
    conn.commit()

    cur.execute("""
        SELECT count(*)
        FROM projects
        WHERE workflow_status IN ('SUBMITTED', 'IN_REVIEW')
          AND is_archived = false
    """)
    to_archive = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM projects WHERE is_archived = true")
    already = cur.fetchone()[0]

    print(f"\n{'='*70}")
    print(f"  Pending (SUBMITTED/IN_REVIEW, not archived) : {to_archive}")
    print(f"  Already archived                            : {already}")
    print(f"{'='*70}\n")

    if to_archive == 0:
        print("Nothing to archive — the review queue is already clear.\n")
        cur.close()
        conn.close()
        return

    if not args.apply:
        print("Dry run — pass --apply to archive these submissions.\n")
        cur.close()
        conn.close()
        return

    print("Archiving...")
    cur.execute("""
        UPDATE projects
        SET is_archived = true
        WHERE workflow_status IN ('SUBMITTED', 'IN_REVIEW')
          AND is_archived = false
    """)
    conn.commit()
    print(f"Done. {cur.rowcount} project(s) archived (status unchanged, still visible on the map).\n")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
