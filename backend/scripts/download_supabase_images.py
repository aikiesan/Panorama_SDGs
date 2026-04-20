"""
Download 2023 guidebook images from Supabase public storage bucket.

The local DB already has URLs remapped to /project_images/{filename}.
This script reconstructs the original Supabase public URL from the filename,
downloads the file if it doesn't already exist on disk, and reports results.

Run from project root:
  python backend/scripts/download_supabase_images.py

Requires: requests  (pip install requests)
"""
import os
import re
import sys
import urllib.parse
from pathlib import Path

try:
    import requests
except ImportError:
    print("[ERROR] 'requests' is not installed. Run: pip install requests")
    sys.exit(1)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SUPABASE_URL = "https://adbyciulrgmhwlcsodfy.supabase.co"
BUCKET = "project-images"
STORAGE_BASE = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}"

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DEST_DIR = PROJECT_ROOT / "frontend" / "public" / "project_images"

# Matches EFP1, IFF12, LDP100 etc.
CODE_PATTERN = re.compile(r"(EFP|IFF|LDP)\d+", re.IGNORECASE)

# ---------------------------------------------------------------------------

def get_image_urls_from_db():
    """Read all non-P image URLs from the local Docker DB via psycopg2."""
    try:
        import psycopg2
    except ImportError:
        print("[ERROR] psycopg2 not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        dbname="atlas_db",
        user="atlas_user",
        password="atlas_pass",
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT image_url
        FROM project_images
        WHERE image_url NOT LIKE '/project_images/P%'
        ORDER BY image_url
    """)
    rows = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return rows


def reconstruct_supabase_url(local_path: str) -> tuple[str, str] | None:
    """
    Given a local path like '/project_images/Building%20Analysis%20-%20IFF11.webp',
    return (supabase_url, local_filename) or None if code can't be found.
    """
    # Extract just the filename (URL-encoded)
    encoded_filename = local_path.split("/")[-1]
    # Decode to find the project code
    decoded = urllib.parse.unquote(encoded_filename)
    m = CODE_PATTERN.search(decoded)
    if not m:
        return None
    code = m.group(0).upper()
    # Supabase URL: /storage/v1/object/public/{bucket}/{CODE}/{encoded_filename}
    supabase_url = f"{STORAGE_BASE}/{code}/{encoded_filename}"
    return supabase_url, encoded_filename


def download_images():
    DEST_DIR.mkdir(parents=True, exist_ok=True)

    print("[INFO] Reading image URLs from local DB...")
    urls = get_image_urls_from_db()
    print(f"[INFO] {len(urls)} unique 2023 image records found.")

    downloaded = 0
    skipped_exists = 0
    failed = []
    no_code = []

    session = requests.Session()
    session.headers.update({"User-Agent": "UIA-Atlas-ImageSync/1.0"})

    for i, local_path in enumerate(urls, 1):
        encoded_filename = local_path.split("/")[-1]
        dest_file = DEST_DIR / encoded_filename

        if dest_file.exists():
            skipped_exists += 1
            continue

        result = reconstruct_supabase_url(local_path)
        if result is None:
            no_code.append(local_path)
            continue

        supabase_url, _ = result

        try:
            resp = session.get(supabase_url, timeout=30, stream=True)
            if resp.status_code == 200:
                with open(dest_file, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=65536):
                        f.write(chunk)
                downloaded += 1
                if downloaded % 50 == 0:
                    print(f"  ... {downloaded} downloaded so far")
            elif resp.status_code == 404:
                failed.append((local_path, "404 Not Found"))
            else:
                failed.append((local_path, f"HTTP {resp.status_code}"))
        except Exception as e:
            failed.append((local_path, str(e)))

    print(f"\n[DONE]")
    print(f"  Downloaded : {downloaded}")
    print(f"  Already existed: {skipped_exists}")
    if no_code:
        print(f"  Could not extract code: {len(no_code)}")
        for p in no_code[:10]:
            print(f"    {p}")
    if failed:
        print(f"  Failed ({len(failed)}):")
        for path, reason in failed[:20]:
            print(f"    {path}  →  {reason}")


if __name__ == "__main__":
    download_images()
