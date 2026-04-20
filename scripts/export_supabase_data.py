"""
Export all project data from Supabase to a seed SQL file.
Works with the connection pooler URL (no direct connection required).

Usage:
    python scripts/export_supabase_data.py
"""
import os
import sys
from pathlib import Path

DB_URL = "postgresql://postgres.adbyciulrgmhwlcsodfy:M1jTrRzAH3GaOyYu@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
OUTPUT = Path("data/seed/seed.sql")

TABLES_IN_ORDER = [
    "users",
    "projects",
    "project_sdgs",
    "project_typologies",
    "project_requirements",
    "project_images",
]

def export(conn, table: str, f):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM {table}")
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    cur.close()

    if not rows:
        f.write(f"-- {table}: no rows\n\n")
        return

    f.write(f"-- {table} ({len(rows)} rows)\n")
    for row in rows:
        values = []
        for v in row:
            if v is None:
                values.append("NULL")
            elif isinstance(v, bool):
                values.append("TRUE" if v else "FALSE")
            elif isinstance(v, (int, float)):
                values.append(str(v))
            else:
                escaped = str(v).replace("'", "''")
                values.append(f"'{escaped}'")
        col_str = ", ".join(cols)
        val_str = ", ".join(values)
        f.write(f"INSERT INTO {table} ({col_str}) VALUES ({val_str}) ON CONFLICT DO NOTHING;\n")
    f.write("\n")
    print(f"  {table}: {len(rows)} rows exported")


def main():
    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2-binary...")
        os.system(f"{sys.executable} -m pip install psycopg2-binary -q")
        import psycopg2

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    print(f"Connecting to Supabase...")
    conn = psycopg2.connect(DB_URL)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("-- Panorama SDG — Supabase Data Export\n")
        f.write("SET session_replication_role = replica; -- disable FK checks during import\n\n")

        for table in TABLES_IN_ORDER:
            try:
                export(conn, table, f)
            except Exception as e:
                print(f"  WARNING: {table} skipped — {e}")
                conn.rollback()

        f.write("SET session_replication_role = DEFAULT;\n")

    conn.close()
    size = OUTPUT.stat().st_size / 1024
    print(f"\nExported to {OUTPUT} ({size:.1f} KB)")


if __name__ == "__main__":
    main()
