#!/usr/bin/env python3
"""
gen_coords_2026.py
Parses data/sql/supabase_import_2026.sql to extract (ext_code, city, country),
maps each to verified geocoordinates, and writes
data/sql/supabase_update_coordinates_2026.sql.

Usage:
    python scripts/gen_coords_2026.py

Coordinate lookup priority:
  1. CODE_COORD_MAP  — keyed by external_code ("P1", "P42", …)  [preferred]
  2. LEGACY_COORD_MAP — keyed by (city, country) tuple            [fallback]

When adding new entries, prefer CODE_COORD_MAP to avoid city/country collisions
(e.g. multiple projects sharing the same city string or "Unknown" country).
"""

import re
from pathlib import Path

REPO_ROOT  = Path(__file__).parent.parent
INPUT_SQL  = REPO_ROOT / "data" / "sql" / "supabase_import_2026.sql"
OUTPUT_SQL = REPO_ROOT / "data" / "sql" / "supabase_update_coordinates_2026.sql"

# ---------------------------------------------------------------------------
# PRIMARY lookup — keyed by external_code (add entries here to override)
# Values : (latitude, longitude, clean_city, clean_country) OR None (skip)
# ---------------------------------------------------------------------------
CODE_COORD_MAP: dict = {
    # Example:
    # "P6":  None,  # OA — no geocodable location
    "P6":  None,
}

# ---------------------------------------------------------------------------
# LEGACY lookup — keyed by (city_as_stored_in_db, country_as_stored_in_db)
# Kept for backward compatibility; prefer CODE_COORD_MAP for new entries.
# ---------------------------------------------------------------------------
LEGACY_COORD_MAP = {

    # --- Argentina ---
    ("Conlara Valley, San Luis Province", "Argentina"):     (-32.9000,  -66.3000, "Conlara Valley",          "Argentina"),
    ("Casira",                             "Jujuy Puna Argentina"):
                                                             (-22.5000,  -66.4000, "Casira",                  "Argentina"),
    ("CALACOTO/LA PAZ/BOLIVIA PLURINATIONAL STATE", "Unknown"):
                                                             (-16.5000,  -68.1193, "La Paz",                  "Bolivia"),

    # --- Australia ---
    ("Brisbane, Queensland",               "Australia"):    (-27.4698,  153.0251, "Brisbane",                "Australia"),
    ("Townsville, Queensland",             "Australia"):    (-19.2576,  146.8216, "Townsville",              "Australia"),

    # --- Bahrain ---
    ("Diyar Al Muharraq / kingdom of Bahrain", "Unknown"): ( 26.2594,   50.6108, "Muharraq",                "Bahrain"),

    # --- Bangladesh ---
    ("Rupganj, Narayanganj",               "Bangladesh"):   ( 23.7714,   90.4766, "Rupganj",                 "Bangladesh"),
    ("Barishal",                           "Bangladesh"):   ( 22.7010,   90.3535, "Barishal",                "Bangladesh"),
    ("Chadpur",                            "Dhaka"):        ( 23.2335,   90.6626, "Chandpur",                "Bangladesh"),
    ("Narayanganj",                        "Unknown"):      ( 23.6238,   90.4996, "Narayanganj",             "Bangladesh"),

    # --- Bolivia ---
    ("Copacabana/La Paz/Bolivia",          "Unknown"):      (-16.1662,  -69.0853, "Copacabana",              "Bolivia"),

    # --- Brazil / Brasil ---
    ("Bogotá, Cundinamarca",               "Colômbia"):     (  4.6097,  -74.0817, "Bogotá",                  "Colombia"),  # misclassified as Brasil in some rows
    ("Cabo de Santo Agostinho, Pernambuco","Brasil"):       ( -8.2897,  -35.0355, "Cabo de Santo Agostinho", "Brazil"),
    ("Campos do Jordão, São Paulo",        "Brasil"):       (-22.7394,  -45.5889, "Campos do Jordão",        "Brazil"),
    ("São Paulo, São Paulo",               "Brasil"):       (-23.5505,  -46.6333, "São Paulo",               "Brazil"),
    ("Joanópolis, São Paulo",              "Brasil"):       (-22.9253,  -46.2697, "Joanópolis",              "Brazil"),
    ("Maxaranguape, Rio Grande do Norte",  "Brasil"):       ( -5.5208,  -35.2614, "Maxaranguape",            "Brazil"),
    ("Extrema, Minas Gerais",              "Brazil"):       (-22.8561,  -46.3190, "Extrema",                 "Brazil"),
    ("Sao Paulo, SP",                      "Brazil"):       (-23.5505,  -46.6333, "São Paulo",               "Brazil"),
    ("Bagé",                               "Brazil"):       (-31.3286,  -54.1136, "Bagé",                    "Brazil"),
    ("Baía da Traição/Paraíba/Brazil",     "Unknown"):      ( -6.6883,  -34.9318, "Baía da Traição",         "Brazil"),
    ("Sao Paulo/ Sao Paulo / Brasil",      "Unknown"):      (-23.5505,  -46.6333, "São Paulo",               "Brazil"),
    ("São Paulo / SP / Brasil",            "Unknown"):      (-23.5505,  -46.6333, "São Paulo",               "Brazil"),
    ("cidade do Rio de Janeiro/ RJ/ Brasil","Unknown"):     (-22.9068,  -43.1729, "Rio de Janeiro",          "Brazil"),

    # --- Canada ---
    ("Toronto",                            "Unknown"):      ( 43.6532,  -79.3832, "Toronto",                 "Canada"),

    # --- Cabo Verde ---
    ("Mindelo, São Vicente Island",        "Cabo Verde"):   ( 16.8890,  -24.9950, "Mindelo",                 "Cabo Verde"),

    # --- China ---
    ("Beijing",                            "China"):        ( 39.9042,  116.4074, "Beijing",                 "China"),
    ("Beijing/China",                      "Unknown"):      ( 39.9042,  116.4074, "Beijing",                 "China"),
    ("Beijing / China",                    "Unknown"):      ( 39.9042,  116.4074, "Beijing",                 "China"),
    ("China",                              "Unknown"):      ( 39.9042,  116.4074, "Beijing",                 "China"),
    ("Dingzhou, Hebei Province",           "China"):        ( 38.5138,  114.9899, "Dingzhou",                "China"),
    ("Houyuan Village, Wuyishan City, Fujian Province",
                                           "China"):        ( 27.7568,  118.0352, "Wuyishan",                "China"),
    ("Jiaxing, Zhejiang",                  "China"):        ( 30.7521,  120.7500, "Jiaxing",                 "China"),
    ("Lijiang City, Yunnan province",      "China"):        ( 26.8721,  100.2299, "Lijiang",                 "China"),
    ("Macha Village, Huining County, Baiyin City, Gansu Province",
                                           "China"):        ( 35.6854,  105.0000, "Huining",                 "China"),
    ("Nanjing / Jiangsu / China",          "Unknown"):      ( 32.0603,  118.7969, "Nanjing",                 "China"),
    ("Renhua County, Guangdong Province",  "China"):        ( 25.0879,  113.6925, "Renhua",                  "China"),
    ("Shanghai",                           "China"):        ( 31.2304,  121.4737, "Shanghai",                "China"),
    ("Tangshan / China",                   "Unknown"):      ( 39.6310,  118.1800, "Tangshan",                "China"),
    ("Wanjian Village, Qianshan County, Anhui Province",
                                           "China"):        ( 30.6333,  116.5667, "Qianshan",                "China"),
    ("Xuzhou/Jiangsu Province/China",      "Unknown"):      ( 34.2044,  117.2844, "Xuzhou",                  "China"),
    ("Hong Kong SAR",                      "China"):        ( 22.3193,  114.1694, "Hong Kong",               "China"),

    # --- Colombia ---
    ("Bogotá",                             "Colombia"):     (  4.6097,  -74.0817, "Bogotá",                  "Colombia"),
    ("Valledupar/Cesar/Colombia",          "Unknown"):      ( 10.4631,  -73.2532, "Valledupar",              "Colombia"),
    ("Funza, Cundinamarca",                "Colombia"):     (  4.7147,  -74.2130, "Funza",                   "Colombia"),

    # --- Cyprus ---
    ("Nicosia",                            "Cyprus"):       ( 35.1856,   33.3823, "Nicosia",                 "Cyprus"),

    # --- Egypt ---
    ("Lake Mariout , Alexandria",          "Egypt"):        ( 30.9200,   29.7700, "Alexandria",              "Egypt"),
    ("Alexandria",                         "Egypt"):        ( 31.2001,   29.9187, "Alexandria",              "Egypt"),
    ("Cairo",                              "Unknown"):      ( 30.0444,   31.2357, "Cairo",                   "Egypt"),
    ("New Capital",                        "Egypt"):        ( 30.0200,   31.8000, "New Administrative Capital","Egypt"),
    ("Fayoum",                             "Egypt"):        ( 29.3084,   30.8428, "Fayoum",                  "Egypt"),
    ("6 October",                          "Unknown"):      ( 29.0331,   30.9694, "6th of October City",     "Egypt"),

    # --- El Salvador ---
    ("Suchitoto",                          "El Salvador"):  ( 13.9306,  -89.0333, "Suchitoto",               "El Salvador"),
    ("San Salvador/ El Salvador",          "Unknown"):      ( 13.6929,  -89.2182, "San Salvador",            "El Salvador"),

    # --- Germany ---
    ("Neuperlach München/Deutschland",     "Unknown"):      ( 48.0942,   11.6421, "Munich",                  "Germany"),

    # --- Greece ---
    ("ATHENS / ATTIKI / GREECE",           "Unknown"):      ( 37.9838,   23.7275, "Athens",                  "Greece"),
    ("ATHENS / ATTICA / GREECE",           "Unknown"):      ( 37.9838,   23.7275, "Athens",                  "Greece"),
    ("Athens Attiki Greece",               "Unknown"):      ( 37.9838,   23.7275, "Athens",                  "Greece"),
    ("Gazi, Athens",                       "Greece"):       ( 37.9778,   23.7163, "Athens",                  "Greece"),
    ("Omonoia, Athens",                    "Greece"):       ( 37.9848,   23.7283, "Athens",                  "Greece"),
    ("Kefalari,Kifissia",                  "Greece"):       ( 38.0745,   23.8156, "Kifissia",                "Greece"),
    ("Kifissia",                           "Greece"):       ( 38.0745,   23.8156, "Kifissia",                "Greece"),
    ("Thessaloniki",                       "Greece"):       ( 40.6401,   22.9444, "Thessaloniki",            "Greece"),
    ("Heraklion, Crete",                   "Greece"):       ( 35.3387,   25.1442, "Heraklion",               "Greece"),
    ("Chania, Crete",                      "Greece"):       ( 35.5138,   24.0180, "Chania",                  "Greece"),
    ("Dimitsana, Nomos Arkadias",          "Greece"):       ( 37.5898,   22.0418, "Dimitsana",               "Greece"),
    ("Rio, Achaia",                        "Greece"):       ( 38.3072,   21.7842, "Rio",                     "Greece"),
    ("Kythnos Island",                     "Greece"):       ( 37.3833,   24.4167, "Kythnos",                 "Greece"),
    ("Tinos",                              "Greece"):       ( 37.5382,   25.1663, "Tinos",                   "Greece"),
    ("Elefsina",                           "Greece"):       ( 38.0432,   23.5400, "Elefsina",                "Greece"),
    ("Aspra Spitia/Boetia/ Greece",        "Unknown"):      ( 38.3617,   22.8625, "Aspra Spitia",            "Greece"),

    # --- Hong Kong ---
    ("Hong Kong",                          "Unknown"):      ( 22.3193,  114.1694, "Hong Kong",               "China"),

    # --- India ---
    ("Gram Lodsi, Rishikesh",              "Uttarakhand"):  ( 30.0869,   78.2676, "Rishikesh",               "India"),
    ("Ayodhya, Uttar Pradesh",             "India"):        ( 26.7922,   82.1998, "Ayodhya",                 "India"),
    ("Bangalore/Karnataka/India",          "Unknown"):      ( 12.9716,   77.5946, "Bangalore",               "India"),
    ("Chikkaballapur/Karnataka/India",     "Unknown"):      ( 13.4346,   77.7274, "Chikkaballapur",          "India"),
    ("Chennai, Tamil Nadu",                "India"):        ( 13.0827,   80.2707, "Chennai",                 "India"),
    ("Chengalpet District/Tamil Nadu/India","Unknown"):     ( 12.6921,   79.9899, "Chengalpet",              "India"),
    ("Coimbatore, Tamil Nadu",             "India"):        ( 11.0168,   76.9558, "Coimbatore",              "India"),
    ("Dhuliyan",                           "West Bengal"):  ( 24.6833,   87.9333, "Dhuliyan",                "India"),
    ("Gurugram, Haryana",                  "India"):        ( 28.4595,   77.0266, "Gurugram",                "India"),
    ("Gurugram",                           "Haryana | INDIA"):
                                                             ( 28.4595,   77.0266, "Gurugram",                "India"),
    ("Jaipur/Rajasthan/India",             "Unknown"):      ( 26.9124,   75.7873, "Jaipur",                  "India"),
    ("Jodhpur, Rajasthan",                 "India"):        ( 26.2389,   73.0243, "Jodhpur",                 "India"),
    ("Mumbai/Maharashtra/India",           "Unknown"):      ( 19.0760,   72.8777, "Mumbai",                  "India"),
    ("Mumbai",                             "Unknown"):      ( 19.0760,   72.8777, "Mumbai",                  "India"),
    ("New Delhi, Delhi",                   "India"):        ( 28.6139,   77.2090, "New Delhi",               "India"),
    ("Khurrianwala, Punjab",               "Pakistan"):     ( 31.5172,   73.2667, "Khurrianwala",            "Pakistan"),

    # --- Italy ---
    ("Bassano del Grappa, Vicenza",        "Italy"):        ( 45.7656,   11.7346, "Bassano del Grappa",      "Italy"),
    ("Casalecchio di Reno",                "Unknown"):      ( 44.4737,   11.2926, "Casalecchio di Reno",     "Italy"),

    # --- Japan ---
    ("Mount Rokkō in Kobe",                "Japan"):        ( 34.7704,  135.2406, "Kobe",                    "Japan"),
    ("Tokyo",                              "Unknown"):      ( 35.6762,  139.6503, "Tokyo",                   "Japan"),
    ("Yanaka / Tokyo / Japan",             "Unknown"):      ( 35.7260,  139.7673, "Tokyo",                   "Japan"),
    ("Hokuei Town/Tottori Prefecture/Japan","Unknown"):     ( 35.5011,  133.8414, "Hokuei",                  "Japan"),

    # --- Malaysia ---
    ("Kuala Lumpur/ Malaysia",             "Unknown"):      (  3.1390,  101.6869, "Kuala Lumpur",            "Malaysia"),
    ("bukit jalil",                        "Unknown"):      (  3.0604,  101.6917, "Bukit Jalil",             "Malaysia"),

    # --- Mexico / México ---
    ("CDMX",                               "Coyoacan"):     ( 19.3467,  -99.1617, "Mexico City",             "Mexico"),
    ("Mexico City",                        "Unknown"):      ( 19.4326,  -99.1332, "Mexico City",             "Mexico"),
    ("Mérida, Yucatán",                    "México"):       ( 20.9674,  -89.6235, "Mérida",                  "Mexico"),
    ("Puebla de Zaragoza",                 "México"):       ( 19.0413,  -98.2062, "Puebla",                  "Mexico"),
    ("Santiago Niltepec, Oaxaca",          "México"):       ( 16.5378,  -94.5972, "Santiago Niltepec",       "Mexico"),
    ("Villahermosa, Tabasco",              "México"):       ( 17.9892,  -92.9475, "Villahermosa",            "Mexico"),
    ("Xalapa/Veracruz/Mexico",             "Unknown"):      ( 19.5438,  -96.9269, "Xalapa",                  "Mexico"),
    ("Uruapan Michoacán México",           "Unknown"):      ( 19.4200, -102.0630, "Uruapan",                 "Mexico"),
    ("Puebla / Puebla / México",           "Unknown"):      ( 19.0413,  -98.2062, "Puebla",                  "Mexico"),
    ("Cintalapa",                          "Chiapas"):      ( 16.6917,  -93.7189, "Cintalapa",               "Mexico"),

    # --- Morocco ---
    ("AGADIR/Souss Massa/Morocco",         "Unknown"):      ( 30.4278,   -9.5981, "Agadir",                  "Morocco"),

    # --- Nepal ---
    ("Rural Nepal",                        "Unknown"):      ( 28.0000,   84.0000, "Nepal",                   "Nepal"),

    # --- Netherlands ---
    ("Netherlands",                        "Unknown"):      ( 52.3676,    4.9041, "Amsterdam",               "Netherlands"),

    # --- Pakistan ---
    ("Qasba colony, Karachi",              "pakistan"):     ( 24.8607,   67.0011, "Karachi",                 "Pakistan"),

    # --- Philippines ---
    ("Manila",                             "Philippines"):  ( 14.5995,  120.9842, "Manila",                  "Philippines"),
    ("Gubat Sorsogon",                     "Philippines"):  ( 12.9199,  124.1212, "Gubat",                   "Philippines"),

    # --- Serbia ---
    ("Novi Sad",                           "Serbia"):       ( 45.2671,   19.8335, "Novi Sad",                "Serbia"),

    # --- South Korea ---
    ("Seoul / South Korea",                "Unknown"):      ( 37.5665,  126.9780, "Seoul",                   "South Korea"),

    # --- Sri Lanka ---
    ("Colombo",                            "Sri Lanka"):    (  6.9271,   79.8612, "Colombo",                 "Sri Lanka"),

    # --- Switzerland ---
    ("Allschwill/ Basel-Landschaft/Switzerland","Unknown"): ( 47.5497,    7.5401, "Allschwil",               "Switzerland"),
    ("Basel",                              "Unknown"):      ( 47.5596,    7.5886, "Basel",                   "Switzerland"),
    ("Bern",                               "Unknown"):      ( 46.9480,    7.4474, "Bern",                    "Switzerland"),
    ("Oberburg/Switzerland",               "Unknown"):      ( 46.9963,    7.6171, "Oberburg",                "Switzerland"),
    ("Winterthur; Schweiz",                "Unknown"):      ( 47.4994,    8.7243, "Winterthur",              "Switzerland"),
    ("Winthertur/Switzerland",             "Unknown"):      ( 47.4994,    8.7243, "Winterthur",              "Switzerland"),
    ("Zürich",                             "Schweiz"):      ( 47.3769,    8.5417, "Zurich",                  "Switzerland"),
    ("Zürich/Switzerland",                 "Unknown"):      ( 47.3769,    8.5417, "Zurich",                  "Switzerland"),

    # --- Tunisia ---
    ("Belvédère Park, Tunis",              "Tunisia"):      ( 36.8190,   10.1658, "Tunis",                   "Tunisia"),

    # --- Turkey / Türkiye ---
    ("Istanbul / Turkiye",                 "Unknown"):      ( 41.0082,   28.9784, "Istanbul",                "Turkey"),
    ("Adana/Turkey",                       "Unknown"):      ( 37.0000,   35.3213, "Adana",                   "Turkey"),
    ("Balikesir/Türkiye",                  "Unknown"):      ( 39.6484,   27.8826, "Balikesir",               "Turkey"),
    ("Gölbaşı / Ankara / Turkey",          "Unknown"):      ( 39.7935,   32.8064, "Gölbaşı",                 "Turkey"),
    ("Milas, Muğla",                       "Turkey"):       ( 37.3168,   27.7839, "Milas",                   "Turkey"),

    # --- UAE ---
    ("Umm Al Quwain",         "United Arab Emirates (UAE)"):( 25.5647,   55.5533, "Umm Al Quwain",           "United Arab Emirates"),
    ("Masdar City / Abu Dhabi / United Arab Emirates",
                                           "Unknown"):      ( 24.4296,   54.6173, "Masdar City",             "United Arab Emirates"),
    ("Dubai / United Arab Emirates",       "Unknown"):      ( 25.2048,   55.2708, "Dubai",                   "United Arab Emirates"),

    # --- United Kingdom ---
    ("London / United Kingdom",            "Unknown"):      ( 51.5074,   -0.1278, "London",                  "United Kingdom"),

    # --- USA ---
    ("Seattle",                            "WA USA"):       ( 47.6062, -122.3321, "Seattle",                 "United States of America"),
    ("Seattle/Washington/United States",   "Unknown"):      ( 47.6062, -122.3321, "Seattle",                 "United States of America"),
    ("Seattle/Washington/USA",             "Unknown"):      ( 47.6062, -122.3321, "Seattle",                 "United States of America"),
    ("Bainbridge Island / Washington / USA","Unknown"):     ( 47.6262, -122.5211, "Bainbridge Island",       "United States of America"),
    ("Austiın / Texas / USA",              "Unknown"):      ( 30.2672,  -97.7431, "Austin",                  "United States of America"),
    ("Tucson, Arizona",       "United States of America"):  ( 32.2226, -110.9747, "Tucson",                  "United States of America"),
    ("Fort Myers, Florida",                "USA"):          ( 26.6406,  -81.8723, "Fort Myers",              "United States of America"),
    ("Washington, DC",                     "USA"):          ( 38.9072,  -77.0369, "Washington, DC",          "United States of America"),
    ("West Oakland, California",           "USA"):          ( 37.8044, -122.2712, "Oakland",                 "United States of America"),
    ("New York City / USA",                "Unknown"):      ( 40.7128,  -74.0060, "New York City",           "United States of America"),
    ("Atlanta/Georgia/United States",      "Unknown"):      ( 33.7490,  -84.3880, "Atlanta",                 "United States of America"),

    # --- Vietnam ---
    ("Hue City",                           "Vietnam"):      ( 16.4637,  107.5909, "Huế",                     "Vietnam"),
    ("Da Nang",                            "Viet nam"):     ( 16.0544,  108.2022, "Da Nang",                 "Vietnam"),

    # --- Zimbabwe ---
    ("Harare",                             "Zimbabwe"):     (-17.8252,   31.0335, "Harare",                  "Zimbabwe"),

    # --- Skip (no geocodable location) ---
    ("OA",                                 "Unknown"):      None,

    # --- Missing entries discovered on first run ---
    ("Logrono / Spain",                    "Unknown"):      ( 42.4641,   -2.4489, "Logroño",                 "Spain"),
    ("bouira.sour el ghozlan",             "Unknown"):      ( 36.1375,    3.6856, "Sour El Ghozlane",        "Algeria"),
    ("Dhaka",                              "Unknown"):      ( 23.7104,   90.4074, "Dhaka",                   "Bangladesh"),
    ("Abu Dhabi / United Arab Emirates",   "Unknown"):      ( 24.4539,   54.3773, "Abu Dhabi",               "United Arab Emirates"),
    ("Bengaluru/Karnataka/India",          "Unknown"):      ( 12.9716,   77.5946, "Bangalore",               "India"),
    ("Guadix, Andalusia",                  "Spain"):        ( 37.2978,   -3.1372, "Guadix",                  "Spain"),
    ("Zhuhai, Guangdong",                  "China"):        ( 22.2710,  113.5767, "Zhuhai",                  "China"),
    ("São Paulo, São Paulo",               "Brazil"):       (-23.5505,  -46.6333, "São Paulo",               "Brazil"),
}

# Alias for backward compatibility
COORD_MAP = LEGACY_COORD_MAP


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main():
    if not INPUT_SQL.exists():
        print(f"ERROR: {INPUT_SQL} not found"); return

    content = INPUT_SQL.read_text(encoding="utf-8")

    # Split on "-- Row N: Pn" markers to isolate each project block
    parts = re.split(r"-- Row \d+: (P\d+)\n", content)
    # parts[0] = header preamble
    # then pairs: parts[2i-1] = ext_code, parts[2i] = block text

    projects = []
    i = 1
    while i < len(parts) - 1:
        ext_code = parts[i].strip()
        block    = parts[i + 1]
        i += 2

        # Extract city and country from the VALUES line containing SECTION_
        # City may be NULL (blank submissions) or a quoted string
        m = re.search(
            r"'SECTION_[IV]+',\s*(NULL|'(?:[^']|'')*'),\s*(NULL|'(?:[^']|'')*')",
            block
        )
        if m:
            raw_city    = m.group(1)
            raw_country = m.group(2)
            if raw_city == "NULL":
                # No location data — skip silently
                continue
            city    = raw_city[1:-1].replace("''", "'")
            country = raw_country[1:-1].replace("''", "'") if raw_country != "NULL" else "Unknown"
            projects.append((ext_code, city, country))
        else:
            print(f"  WARNING: could not parse city/country for {ext_code}")

    print(f"Parsed {len(projects)} projects from import SQL")

    lines = [
        "-- =============================================================================",
        "-- supabase_update_coordinates_2026.sql",
        "-- Sets latitude, longitude, city (clean), country (clean)",
        "-- for 175 UIA 2026 Guidebook projects (external_code P1–P175)",
        "-- Idempotent — safe to re-run.",
        "-- =============================================================================",
        "",
        "-- Run in Supabase SQL Editor AFTER supabase_import_2026.sql (all 8 chunks).",
        "",
    ]

    updated  = 0
    skipped  = 0
    missing  = []

    for ext_code, city, country in projects:
        # Primary lookup: by external_code (avoids city/country collision)
        if ext_code in CODE_COORD_MAP:
            coords = CODE_COORD_MAP[ext_code]
        else:
            # Fallback: legacy city/country tuple lookup
            key = (city, country)
            if key not in LEGACY_COORD_MAP:
                missing.append(f"  -- MISSING: {ext_code} → {key!r}")
                lines.append(f"-- MISSING: {ext_code}  city={city!r}  country={country!r}")
                continue
            coords = LEGACY_COORD_MAP[key]

        if coords is None:
            lines.append(f"-- SKIP {ext_code}: no geocodable location ({city!r}, {country!r})")
            skipped += 1
            continue

        lat, lon, clean_city, clean_country = coords
        lines += [
            f"-- {ext_code}: {clean_city}, {clean_country}",
            f"UPDATE projects",
            f"    SET latitude  = {lat},",
            f"        longitude = {lon},",
            f"        city      = {sql_str(clean_city)},",
            f"        country   = {sql_str(clean_country)}",
            f"    WHERE external_code = {sql_str(ext_code)};",
            "",
        ]
        updated += 1

    lines += [
        "-- =============================================================================",
        "-- Verification (run after applying this script):",
        "-- =============================================================================",
        f"-- Total UPDATEs : {updated}",
        f"-- Skipped       : {skipped}",
        f"-- Missing       : {len(missing)}",
        "--",
        "-- SELECT COUNT(*) FROM projects WHERE latitude IS NOT NULL AND external_code LIKE 'P%';",
        f"-- expect: {updated}",
        "-- SELECT country, COUNT(*) FROM projects",
        "--   WHERE external_code LIKE 'P%' AND latitude IS NOT NULL",
        "--   GROUP BY country ORDER BY COUNT(*) DESC;",
        "",
    ]

    OUTPUT_SQL.write_text("\n".join(lines), encoding="utf-8")
    print(f"Written: {OUTPUT_SQL}")
    print(f"  UPDATEs  : {updated}")
    print(f"  Skipped  : {skipped}")
    print(f"  Missing  : {len(missing)}")
    if missing:
        print("\nMissing mappings (add to COORD_MAP):")
        for m in missing:
            print(m.encode("ascii", errors="replace").decode())


if __name__ == "__main__":
    main()
