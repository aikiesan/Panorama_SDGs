"""
Patch organization_name, contact_person, authors, and country fields for 2026
projects that were imported with hardcoded 'Unknown' values.

Data source: Guidebook 2026.xlsx → sheet "Resultado Total"
  Col 0: PROJECT # → external_code
  Col 4: Country   → country
  Col 5: Architect(s) → contact_person + authors
  Col 6: Professional Architectural Organisation → organization_name

Run from project root:
  python backend/scripts/patch_unknown_fields.py
"""
import os
import sys
from pathlib import Path

import openpyxl
import psycopg2
from psycopg2.extras import execute_values

PROJECT_ROOT = Path(__file__).parent.parent.parent

EXCEL_PATH = (
    PROJECT_ROOT
    / "PROJETO_AGENDA_UIA_2026"
    / "_UIA-20260410T210012Z-3-001"
    / "_UIA"
    / "Guidebook 2026.xlsx"
)

DB = dict(host="localhost", port=5432, dbname="atlas_db", user="atlas_user", password="atlas_pass")

COL_CODE    = 0
COL_COUNTRY = 4
COL_ARCH    = 5
COL_ORG     = 6


def clean(val) -> str:
    """Strip whitespace and return empty string for None/blank."""
    if val is None:
        return ""
    return str(val).strip()


def load_excel_data() -> dict[str, dict]:
    """Return dict: external_code -> {org, architect, country}."""
    wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)
    ws = wb["Resultado Total"]

    data: dict[str, dict] = {}
    skipped_header = False

    for row in ws.iter_rows(values_only=True):
        code = clean(row[COL_CODE] if len(row) > COL_CODE else None)
        if not code or not code.startswith("P"):
            skipped_header = True
            continue

        org      = clean(row[COL_ORG]     if len(row) > COL_ORG     else None)
        architect = clean(row[COL_ARCH]    if len(row) > COL_ARCH    else None)
        country   = clean(row[COL_COUNTRY] if len(row) > COL_COUNTRY else None)

        data[code] = {"org": org, "architect": architect, "country": country}

    wb.close()
    print(f"[INFO] Loaded {len(data)} project entries from Excel.")
    return data


def patch_db(data: dict[str, dict]):
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()

    updated_org = updated_person = updated_authors = updated_country = 0
    not_found = []

    for code, fields in data.items():
        org       = fields["org"]
        architect = fields["architect"]
        country   = fields["country"]

        # Check current values
        cur.execute(
            "SELECT organization_name, contact_person, authors, country FROM projects WHERE external_code = %s",
            (code,),
        )
        row = cur.fetchone()
        if not row:
            not_found.append(code)
            continue

        cur_org, cur_person, cur_authors, cur_country = row

        set_parts = []
        params = []

        if cur_org in ("Unknown", None, "") and org:
            set_parts.append("organization_name = %s")
            params.append(org)
            updated_org += 1

        if cur_person in ("Unknown", None, "") and architect:
            set_parts.append("contact_person = %s")
            params.append(architect)
            updated_person += 1

        # Always enrich authors if we have data and field is empty
        if not cur_authors and architect:
            set_parts.append("authors = %s")
            params.append(architect)
            updated_authors += 1

        if cur_country in ("Unknown", None, "") and country:
            set_parts.append("country = %s")
            params.append(country)
            updated_country += 1

        if set_parts:
            params.append(code)
            cur.execute(
                f"UPDATE projects SET {', '.join(set_parts)} WHERE external_code = %s",
                params,
            )

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n[DONE] Fields updated:")
    print(f"  organization_name : {updated_org}")
    print(f"  contact_person    : {updated_person}")
    print(f"  authors           : {updated_authors}")
    print(f"  country           : {updated_country}")
    if not_found:
        print(f"  Not in DB ({len(not_found)}): {not_found}")


def verify():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) FROM projects
        WHERE (organization_name = 'Unknown' OR contact_person = 'Unknown')
          AND external_code LIKE 'P%%'
    """)
    remaining = cur.fetchone()[0]
    cur.close()
    conn.close()
    print(f"\n[VERIFY] P-coded projects still with 'Unknown' org or contact: {remaining}")


if __name__ == "__main__":
    print(f"[INFO] Reading: {EXCEL_PATH}")
    data = load_excel_data()
    patch_db(data)
    verify()
