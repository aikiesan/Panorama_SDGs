"""
Fix Docker DB after seed import:
1. Swap SECTION_III <-> SECTION_V (region data was swapped in original import)
2. Add columns missing from the seed (other_typology_text, other_funding_text, other_gov_text, authors)
"""
import os
import psycopg2

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    raise SystemExit("DATABASE_URL not set")

conn = psycopg2.connect(db_url)
conn.autocommit = False
cur = conn.cursor()

print("1. Swapping SECTION_III <-> SECTION_V regions...")
cur.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS region_tmp TEXT")
cur.execute("UPDATE projects SET region_tmp = uia_region::text")
cur.execute("UPDATE projects SET uia_region = 'SECTION_V' WHERE region_tmp = 'SECTION_III'")
cur.execute("UPDATE projects SET uia_region = 'SECTION_III' WHERE region_tmp = 'SECTION_V'")
cur.execute("ALTER TABLE projects DROP COLUMN region_tmp")
conn.commit()
print("   Done.")

print("2. Adding missing columns...")
for col, typ in [
    ("other_typology_text", "TEXT"),
    ("other_funding_text",  "TEXT"),
    ("other_gov_text",      "TEXT"),
    ("authors",             "TEXT"),
]:
    cur.execute(f"ALTER TABLE projects ADD COLUMN IF NOT EXISTS {col} {typ}")
    print(f"   + {col}")
conn.commit()
print("   Done.")

cur.close()
conn.close()
print("\nAll fixes applied successfully.")
