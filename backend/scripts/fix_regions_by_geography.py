"""
Review and correct uia_region assignments based on project geography.

UIA Sections (UIA Guidebook definitions):
  SECTION_I   — Western Europe
  SECTION_II  — Central and Eastern Europe
  SECTION_III — The Americas
  SECTION_IV  — Asia and Oceania  (includes Middle East)
  SECTION_V   — Africa

Usage:
    # Dry run — shows what would change
    python scripts/fix_regions_by_geography.py

    # Apply fixes
    python scripts/fix_regions_by_geography.py --apply
"""
import os
import sys
import argparse
import psycopg2

# ---------------------------------------------------------------------------
# Country → Correct UIA Section mapping
# ---------------------------------------------------------------------------
COUNTRY_SECTION = {
    # SECTION_I — Western Europe
    "United Kingdom": "SECTION_I",
    "UK": "SECTION_I",
    "France": "SECTION_I",
    "Germany": "SECTION_I",
    "Italy": "SECTION_I",
    "Spain": "SECTION_I",
    "Portugal": "SECTION_I",
    "Netherlands": "SECTION_I",
    "Belgium": "SECTION_I",
    "Switzerland": "SECTION_I",
    "Austria": "SECTION_I",
    "Sweden": "SECTION_I",
    "Norway": "SECTION_I",
    "Denmark": "SECTION_I",
    "Finland": "SECTION_I",
    "Ireland": "SECTION_I",
    "Luxembourg": "SECTION_I",
    "Greece": "SECTION_I",
    "Cyprus": "SECTION_I",
    "Malta": "SECTION_I",
    "Iceland": "SECTION_I",
    "Andorra": "SECTION_I",
    "Monaco": "SECTION_I",
    "Liechtenstein": "SECTION_I",
    "San Marino": "SECTION_I",
    "Vatican": "SECTION_I",

    # SECTION_II — Central and Eastern Europe
    "Russia": "SECTION_II",
    "Russian Federation": "SECTION_II",
    "Ukraine": "SECTION_II",
    "Poland": "SECTION_II",
    "Czech Republic": "SECTION_II",
    "Czechia": "SECTION_II",
    "Slovakia": "SECTION_II",
    "Hungary": "SECTION_II",
    "Romania": "SECTION_II",
    "Bulgaria": "SECTION_II",
    "Serbia": "SECTION_II",
    "Croatia": "SECTION_II",
    "Slovenia": "SECTION_II",
    "Bosnia and Herzegovina": "SECTION_II",
    "Bosnia": "SECTION_II",
    "Montenegro": "SECTION_II",
    "North Macedonia": "SECTION_II",
    "Albania": "SECTION_II",
    "Belarus": "SECTION_II",
    "Moldova": "SECTION_II",
    "Lithuania": "SECTION_II",
    "Latvia": "SECTION_II",
    "Estonia": "SECTION_II",
    "Kazakhstan": "SECTION_II",
    "Uzbekistan": "SECTION_II",
    "Kyrgyzstan": "SECTION_II",
    "Tajikistan": "SECTION_II",
    "Turkmenistan": "SECTION_II",
    "Azerbaijan": "SECTION_II",
    "Armenia": "SECTION_II",
    "Georgia": "SECTION_II",
    "Turkey": "SECTION_II",
    "Türkiye": "SECTION_II",
    "Kosovo": "SECTION_II",

    # SECTION_III — The Americas
    "United States": "SECTION_III",
    "United States of America": "SECTION_III",
    "USA": "SECTION_III",
    "US": "SECTION_III",
    "Canada": "SECTION_III",
    "Mexico": "SECTION_III",
    "Brazil": "SECTION_III",
    "Argentina": "SECTION_III",
    "Colombia": "SECTION_III",
    "Chile": "SECTION_III",
    "Peru": "SECTION_III",
    "Venezuela": "SECTION_III",
    "Ecuador": "SECTION_III",
    "Bolivia": "SECTION_III",
    "Paraguay": "SECTION_III",
    "Uruguay": "SECTION_III",
    "Cuba": "SECTION_III",
    "Dominican Republic": "SECTION_III",
    "Haiti": "SECTION_III",
    "Jamaica": "SECTION_III",
    "Trinidad and Tobago": "SECTION_III",
    "Barbados": "SECTION_III",
    "Bahamas": "SECTION_III",
    "Puerto Rico": "SECTION_III",
    "Costa Rica": "SECTION_III",
    "Panama": "SECTION_III",
    "Guatemala": "SECTION_III",
    "Honduras": "SECTION_III",
    "El Salvador": "SECTION_III",
    "Nicaragua": "SECTION_III",
    "Belize": "SECTION_III",
    "Guyana": "SECTION_III",
    "Suriname": "SECTION_III",
    "French Guiana": "SECTION_III",

    # SECTION_IV — Asia and Oceania (includes Middle East per UIA)
    # Middle East
    "Lebanon": "SECTION_IV",
    "Syria": "SECTION_IV",
    "Jordan": "SECTION_IV",
    "Israel": "SECTION_IV",
    "Palestine": "SECTION_IV",
    "Palestinian Territories": "SECTION_IV",
    "Iraq": "SECTION_IV",
    "Iran": "SECTION_IV",
    "Saudi Arabia": "SECTION_IV",
    "Yemen": "SECTION_IV",
    "Oman": "SECTION_IV",
    "United Arab Emirates": "SECTION_IV",
    "UAE": "SECTION_IV",
    "Qatar": "SECTION_IV",
    "Kuwait": "SECTION_IV",
    "Bahrain": "SECTION_IV",
    # Asia & Pacific
    "China": "SECTION_IV",
    "Japan": "SECTION_IV",
    "South Korea": "SECTION_IV",
    "Korea": "SECTION_IV",
    "North Korea": "SECTION_IV",
    "India": "SECTION_IV",
    "Pakistan": "SECTION_IV",
    "Bangladesh": "SECTION_IV",
    "Sri Lanka": "SECTION_IV",
    "Nepal": "SECTION_IV",
    "Bhutan": "SECTION_IV",
    "Myanmar": "SECTION_IV",
    "Thailand": "SECTION_IV",
    "Vietnam": "SECTION_IV",
    "Viet Nam": "SECTION_IV",
    "Cambodia": "SECTION_IV",
    "Laos": "SECTION_IV",
    "Malaysia": "SECTION_IV",
    "Singapore": "SECTION_IV",
    "Indonesia": "SECTION_IV",
    "Philippines": "SECTION_IV",
    "Brunei": "SECTION_IV",
    "East Timor": "SECTION_IV",
    "Timor-Leste": "SECTION_IV",
    "Mongolia": "SECTION_IV",
    "Taiwan": "SECTION_IV",
    "Hong Kong": "SECTION_IV",
    "Macao": "SECTION_IV",
    "Macau": "SECTION_IV",
    "Afghanistan": "SECTION_IV",
    "Australia": "SECTION_IV",
    "New Zealand": "SECTION_IV",
    "Papua New Guinea": "SECTION_IV",
    "Fiji": "SECTION_IV",
    "Samoa": "SECTION_IV",
    "Solomon Islands": "SECTION_IV",
    "Vanuatu": "SECTION_IV",
    "Tonga": "SECTION_IV",
    "Kiribati": "SECTION_IV",
    "Micronesia": "SECTION_IV",
    "Palau": "SECTION_IV",
    "Marshall Islands": "SECTION_IV",
    "Nauru": "SECTION_IV",
    "Tuvalu": "SECTION_IV",

    # SECTION_V — Africa
    "Morocco": "SECTION_V",
    "Algeria": "SECTION_V",
    "Tunisia": "SECTION_V",
    "Libya": "SECTION_V",
    "Egypt": "SECTION_V",
    "Sudan": "SECTION_V",
    "South Sudan": "SECTION_V",
    "Ethiopia": "SECTION_V",
    "Kenya": "SECTION_V",
    "Nigeria": "SECTION_V",
    "Ghana": "SECTION_V",
    "South Africa": "SECTION_V",
    "Tanzania": "SECTION_V",
    "Uganda": "SECTION_V",
    "Mozambique": "SECTION_V",
    "Cameroon": "SECTION_V",
    "Senegal": "SECTION_V",
    "Ivory Coast": "SECTION_V",
    "Côte d'Ivoire": "SECTION_V",
    "Madagascar": "SECTION_V",
    "Angola": "SECTION_V",
    "Zimbabwe": "SECTION_V",
    "Zambia": "SECTION_V",
    "Botswana": "SECTION_V",
    "Namibia": "SECTION_V",
    "Rwanda": "SECTION_V",
    "Mali": "SECTION_V",
    "Burkina Faso": "SECTION_V",
    "Niger": "SECTION_V",
    "Chad": "SECTION_V",
    "Somalia": "SECTION_V",
    "Eritrea": "SECTION_V",
    "Djibouti": "SECTION_V",
    "Mauritania": "SECTION_V",
    "Guinea": "SECTION_V",
    "Sierra Leone": "SECTION_V",
    "Liberia": "SECTION_V",
    "Togo": "SECTION_V",
    "Benin": "SECTION_V",
    "Malawi": "SECTION_V",
    "Lesotho": "SECTION_V",
    "Eswatini": "SECTION_V",
    "Swaziland": "SECTION_V",
    "Cabo Verde": "SECTION_V",
    "Cape Verde": "SECTION_V",
    "Comoros": "SECTION_V",
    "Mauritius": "SECTION_V",
    "Seychelles": "SECTION_V",
    "Congo": "SECTION_V",
    "Democratic Republic of the Congo": "SECTION_V",
    "DRC": "SECTION_V",
    "Gabon": "SECTION_V",
    "Central African Republic": "SECTION_V",
    "Equatorial Guinea": "SECTION_V",
    "Guinea-Bissau": "SECTION_V",
    "São Tomé and Príncipe": "SECTION_V",
}

SECTION_LABELS = {
    "SECTION_I":   "Section I - Western Europe",
    "SECTION_II":  "Section II - Central and Eastern Europe",
    "SECTION_III": "Section III - The Americas",
    "SECTION_IV":  "Section IV - Asia and Oceania",
    "SECTION_V":   "Section V - Africa",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply corrections to DB")
    args = parser.parse_args()

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        sys.exit("DATABASE_URL not set")

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    cur.execute("""
        SELECT id, project_name, city, country, uia_region::text
        FROM projects
        ORDER BY country, project_name
    """)
    projects = cur.fetchall()

    corrections = []   # (id, project_name, city, country, current, correct)
    unknowns = set()

    for pid, name, city, country, current in projects:
        correct = COUNTRY_SECTION.get(country)
        if correct is None:
            unknowns.add(country)
            continue
        if correct != current:
            corrections.append((pid, name, city, country, current, correct))

    # ── Report ──────────────────────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"  Total projects : {len(projects)}")
    print(f"  Need fixing    : {len(corrections)}")
    print(f"  Unknown country: {len(unknowns)}")
    print(f"{'='*70}\n")

    if unknowns:
        print("UNKNOWN COUNTRIES (no section mapping — not changed):")
        for c in sorted(unknowns):
            print(f"  - {c}")
        print()

    if corrections:
        print("CORRECTIONS:")
        for pid, name, city, country, current, correct in corrections:
            print(f"  [{country} / {city}]  {name[:50]}")
            print(f"    {current}  →  {correct}  ({SECTION_LABELS[correct]})")
        print()

    if not args.apply:
        print("Dry run — pass --apply to apply these corrections.\n")
        cur.close()
        conn.close()
        return

    # ── Apply ────────────────────────────────────────────────────────────────
    print("Applying corrections...")
    for pid, name, city, country, current, correct in corrections:
        cur.execute(
            "UPDATE projects SET uia_region = %s WHERE id = %s",
            (correct, pid)
        )
    conn.commit()
    print(f"Done. {len(corrections)} project(s) updated.\n")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
