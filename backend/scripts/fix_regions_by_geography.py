"""
Review and correct uia_region assignments based on project geography.

UIA Sections (by project location):
  SECTION_I   — Western Europe
  SECTION_II  — Eastern Europe & Central Asia
  SECTION_III — Middle East & Africa
  SECTION_IV  — Asia & Pacific
  SECTION_V   — Americas

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

    # SECTION_II — Eastern Europe & Central Asia
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

    # SECTION_III — Middle East & Africa
    # Middle East
    "Lebanon": "SECTION_III",
    "Syria": "SECTION_III",
    "Jordan": "SECTION_III",
    "Israel": "SECTION_III",
    "Palestine": "SECTION_III",
    "Palestinian Territories": "SECTION_III",
    "Iraq": "SECTION_III",
    "Iran": "SECTION_III",
    "Saudi Arabia": "SECTION_III",
    "Yemen": "SECTION_III",
    "Oman": "SECTION_III",
    "United Arab Emirates": "SECTION_III",
    "UAE": "SECTION_III",
    "Qatar": "SECTION_III",
    "Kuwait": "SECTION_III",
    "Bahrain": "SECTION_III",
    # Africa
    "Morocco": "SECTION_III",
    "Algeria": "SECTION_III",
    "Tunisia": "SECTION_III",
    "Libya": "SECTION_III",
    "Egypt": "SECTION_III",
    "Sudan": "SECTION_III",
    "South Sudan": "SECTION_III",
    "Ethiopia": "SECTION_III",
    "Kenya": "SECTION_III",
    "Nigeria": "SECTION_III",
    "Ghana": "SECTION_III",
    "South Africa": "SECTION_III",
    "Tanzania": "SECTION_III",
    "Uganda": "SECTION_III",
    "Mozambique": "SECTION_III",
    "Cameroon": "SECTION_III",
    "Senegal": "SECTION_III",
    "Ivory Coast": "SECTION_III",
    "Côte d'Ivoire": "SECTION_III",
    "Madagascar": "SECTION_III",
    "Angola": "SECTION_III",
    "Zimbabwe": "SECTION_III",
    "Zambia": "SECTION_III",
    "Botswana": "SECTION_III",
    "Namibia": "SECTION_III",
    "Rwanda": "SECTION_III",
    "Mali": "SECTION_III",
    "Burkina Faso": "SECTION_III",
    "Niger": "SECTION_III",
    "Chad": "SECTION_III",
    "Somalia": "SECTION_III",
    "Eritrea": "SECTION_III",
    "Djibouti": "SECTION_III",
    "Mauritania": "SECTION_III",
    "Guinea": "SECTION_III",
    "Sierra Leone": "SECTION_III",
    "Liberia": "SECTION_III",
    "Togo": "SECTION_III",
    "Benin": "SECTION_III",
    "Malawi": "SECTION_III",
    "Lesotho": "SECTION_III",
    "Eswatini": "SECTION_III",
    "Swaziland": "SECTION_III",
    "Cabo Verde": "SECTION_III",
    "Cape Verde": "SECTION_III",
    "Comoros": "SECTION_III",
    "Mauritius": "SECTION_III",
    "Seychelles": "SECTION_III",
    "Congo": "SECTION_III",
    "Democratic Republic of the Congo": "SECTION_III",
    "DRC": "SECTION_III",
    "Gabon": "SECTION_III",
    "Central African Republic": "SECTION_III",
    "Equatorial Guinea": "SECTION_III",
    "Guinea-Bissau": "SECTION_III",
    "São Tomé and Príncipe": "SECTION_III",

    # SECTION_IV — Asia & Pacific
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

    # SECTION_V — Americas
    "United States": "SECTION_V",
    "United States of America": "SECTION_V",
    "USA": "SECTION_V",
    "US": "SECTION_V",
    "Canada": "SECTION_V",
    "Mexico": "SECTION_V",
    "Brazil": "SECTION_V",
    "Argentina": "SECTION_V",
    "Colombia": "SECTION_V",
    "Chile": "SECTION_V",
    "Peru": "SECTION_V",
    "Venezuela": "SECTION_V",
    "Ecuador": "SECTION_V",
    "Bolivia": "SECTION_V",
    "Paraguay": "SECTION_V",
    "Uruguay": "SECTION_V",
    "Cuba": "SECTION_V",
    "Dominican Republic": "SECTION_V",
    "Haiti": "SECTION_V",
    "Jamaica": "SECTION_V",
    "Trinidad and Tobago": "SECTION_V",
    "Barbados": "SECTION_V",
    "Bahamas": "SECTION_V",
    "Puerto Rico": "SECTION_V",
    "Costa Rica": "SECTION_V",
    "Panama": "SECTION_V",
    "Guatemala": "SECTION_V",
    "Honduras": "SECTION_V",
    "El Salvador": "SECTION_V",
    "Nicaragua": "SECTION_V",
    "Belize": "SECTION_V",
    "Guyana": "SECTION_V",
    "Suriname": "SECTION_V",
    "French Guiana": "SECTION_V",
}

SECTION_LABELS = {
    "SECTION_I":   "Section I — Western Europe",
    "SECTION_II":  "Section II — Eastern Europe & Central Asia",
    "SECTION_III": "Section III — Middle East & Africa",
    "SECTION_IV":  "Section IV — Asia & Pacific",
    "SECTION_V":   "Section V — Americas",
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
