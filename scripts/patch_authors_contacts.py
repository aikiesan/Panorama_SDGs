#!/usr/bin/env python3
"""
patch_authors_contacts.py

Repairs project rows in the database where contact_email defaulted to
'unknown@unknown.com' during the initial guidebook import.

The 2026 FINAL SELECTION.xlsx has a CONTACT column (index 25 in the
Selection sheet) with submitter email addresses. The original import script
read this correctly, but for rows without a value it fell back to
'unknown@unknown.com'.

NOTE: organization_name and contact_person are not present in the Excel
source — they were legitimately hardcoded as 'Unknown'. This script cannot
patch those fields unless you supply a supplementary mapping manually.

Usage:
    DATABASE_URL=postgresql://... python scripts/patch_authors_contacts.py [--dry-run]
"""

import os
import sys
import warnings
import argparse
from pathlib import Path

warnings.filterwarnings("ignore")

REPO_ROOT  = Path(__file__).parent.parent
EXCEL_FILE = REPO_ROOT / "data" / "raw" / "2026" / "FINAL SELECTION.xlsx"
CONTACT_COL   = 25   # 0-based index of CONTACT in Selection sheet
EXT_CODE_COL  = 1    # 0-based index of PROJECT # in Selection sheet

UNKNOWN_EMAIL    = "unknown@unknown.com"
UNKNOWN_ORG      = "Unknown"
UNKNOWN_CONTACT  = "Unknown"


def load_excel_contacts(excel_path: Path) -> dict[str, str]:
    """Returns {external_code: email} for rows that have a non-empty CONTACT."""
    try:
        import openpyxl
    except ImportError:
        print("ERROR: pip install openpyxl")
        sys.exit(1)

    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb["Selection"]
    mapping: dict[str, str] = {}

    for row in ws.iter_rows(min_row=2, values_only=True):
        ext_code = str(row[EXT_CODE_COL]).strip() if row[EXT_CODE_COL] else None
        if not ext_code or ext_code == "None":
            continue
        email_val = row[CONTACT_COL] if len(row) > CONTACT_COL else None
        email = str(email_val).strip() if email_val else ""
        if email and email.lower() not in ("", "none", "nan") and "@" in email:
            mapping[ext_code] = email

    return mapping


def patch(dry_run: bool = False):
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL environment variable not set.")
        sys.exit(1)

    if not EXCEL_FILE.exists():
        print(f"ERROR: Excel file not found: {EXCEL_FILE}")
        sys.exit(1)

    print(f"Loading Excel: {EXCEL_FILE}")
    excel_contacts = load_excel_contacts(EXCEL_FILE)
    print(f"  Found {len(excel_contacts)} rows with valid contact emails in Excel")

    try:
        from sqlalchemy import create_engine, text
    except ImportError:
        print("ERROR: pip install sqlalchemy")
        sys.exit(1)

    engine = create_engine(db_url)

    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT id, external_code, contact_email, organization_name, contact_person "
                "FROM projects WHERE external_code IS NOT NULL ORDER BY external_code"
            )
        ).fetchall()

    print(f"\nProjects in DB with external_code: {len(rows)}")

    email_updates = 0
    email_skipped_no_excel = 0
    email_already_ok = 0
    no_org_rows = 0

    updates: list[dict] = []

    for row in rows:
        proj_id    = row[0]
        ext_code   = row[1]
        cur_email  = row[2] or ""
        cur_org    = row[3] or ""
        cur_person = row[4] or ""

        if cur_org == UNKNOWN_ORG:
            no_org_rows += 1

        excel_email = excel_contacts.get(ext_code)

        if cur_email == UNKNOWN_EMAIL:
            if excel_email:
                updates.append({"id": proj_id, "email": excel_email, "ext_code": ext_code})
                email_updates += 1
            else:
                email_skipped_no_excel += 1
        else:
            email_already_ok += 1

    print(f"\n--- Patch Summary ---")
    print(f"  Rows with contact_email = '{UNKNOWN_EMAIL}': {email_updates + email_skipped_no_excel}")
    print(f"    - Will be patched (email found in Excel): {email_updates}")
    print(f"    - Cannot patch (no email in Excel):       {email_skipped_no_excel}")
    print(f"  Rows already have a valid email:            {email_already_ok}")
    print(f"  Rows with organization_name = 'Unknown':    {no_org_rows}")
    print(f"    (organization_name/contact_person are NOT in the Excel — manual fix required)")

    if not updates:
        print("\nNothing to update.")
        return

    if dry_run:
        print(f"\n[DRY RUN] Would update {len(updates)} rows:")
        for u in updates[:20]:
            print(f"  {u['ext_code']} → {u['email']}")
        if len(updates) > 20:
            print(f"  ... and {len(updates) - 20} more")
        return

    print(f"\nApplying {len(updates)} updates...")
    with engine.connect() as conn:
        for u in updates:
            conn.execute(
                text("UPDATE projects SET contact_email = :email WHERE id = :id"),
                {"email": u["email"], "id": u["id"]}
            )
        conn.commit()

    print(f"Done. Updated contact_email for {len(updates)} projects.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Patch unknown contact emails from Excel source")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without applying them")
    args = parser.parse_args()
    patch(dry_run=args.dry_run)
