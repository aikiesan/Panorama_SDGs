"""
Upload UIA Guidebook WebP images to MinIO (Docker) or Supabase Storage, then link to projects.

Usage:
    # MinIO (Docker handoff)
    python scripts/upload_guidebook_images.py --source-dir /path/to/webp_output --minio

    # Supabase (legacy cloud)
    python scripts/upload_guidebook_images.py --source-dir /path/to/webp_output

    # Dry run (no uploads)
    python scripts/upload_guidebook_images.py --source-dir /path/to/webp_output --minio --dry-run

Folder structure expected:
    <source-dir>/
        IFF1/   <- folder name must match project external_code exactly
            13 - IFF1.webp
        LDP6/
            ...

CRITICAL: Images are matched strictly by folder name == external_code.
"""
import sys
import os
import argparse
import logging
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

BUCKET = "project-images"


def get_supabase_client():
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise EnvironmentError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env")
    return create_client(url, key)


def get_minio_client():
    import boto3
    from botocore.client import Config
    endpoint = os.environ.get("MINIO_ENDPOINT", "http://localhost:9000")
    access_key = os.environ.get("MINIO_ACCESS_KEY", "minioadmin")
    secret_key = os.environ.get("MINIO_SECRET_KEY", "minioadmin")
    public_url = os.environ.get("MINIO_PUBLIC_URL", endpoint)
    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )
    return client, public_url


def get_db_connection():
    """Get a direct psycopg2 connection for DB writes (works with Docker PostgreSQL or Supabase)."""
    import psycopg2
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise EnvironmentError("DATABASE_URL must be set in backend/.env")
    return psycopg2.connect(db_url)


def lookup_project(code: str, supabase=None, db_conn=None) -> tuple[str | None, str | None]:
    """Returns (project_id, project_name) or (None, None) if not found."""
    if supabase:
        resp = supabase.table("projects").select("id, project_name").eq("external_code", code).execute()
        rows = resp.data or []
        if rows:
            return rows[0]["id"], rows[0]["project_name"]
        return None, None
    else:
        cur = db_conn.cursor()
        cur.execute("SELECT id, project_name FROM projects WHERE external_code = %s LIMIT 1", (code,))
        row = cur.fetchone()
        cur.close()
        if row:
            return str(row[0]), row[1]
        return None, None


def save_image_urls(project_id: str, urls: list[str], supabase=None, db_conn=None):
    """Replace project_images rows for this project with new URLs."""
    if supabase:
        supabase.table("project_images").delete().eq("project_id", project_id).execute()
        rows = [{"project_id": project_id, "image_url": url, "display_order": i} for i, url in enumerate(urls)]
        supabase.table("project_images").insert(rows).execute()
    else:
        cur = db_conn.cursor()
        cur.execute("DELETE FROM project_images WHERE project_id = %s", (project_id,))
        for i, url in enumerate(urls):
            cur.execute(
                "INSERT INTO project_images (project_id, image_url, display_order) VALUES (%s, %s, %s)",
                (project_id, url, i)
            )
        db_conn.commit()
        cur.close()


def process_project_folder(folder: Path, dry_run: bool, s3=None, public_url_base="", supabase=None, db_conn=None):
    code = folder.name
    webp_files = sorted(folder.glob("*.webp"))

    if not webp_files:
        log.warning(f"[{code}] No .webp files found — skipping")
        return 0, 0

    project_id, project_name = lookup_project(code, supabase=supabase, db_conn=db_conn)
    if not project_id:
        log.warning(f"[{code}] No project found with external_code='{code}' — skipping")
        return 0, 1

    log.info(f"[{code}] '{project_name}' | {len(webp_files)} image(s)")

    if dry_run:
        for f in webp_files:
            log.info(f"  [DRY-RUN] Would upload: {f.name}")
        return len(webp_files), 0

    uploaded_urls: list[str] = []
    errors = 0

    for f in webp_files:
        storage_path = f"{code}/{f.name}"
        try:
            with open(f, "rb") as fp:
                data = fp.read()

            if s3:
                s3.put_object(Bucket=BUCKET, Key=storage_path, Body=data, ContentType="image/webp")
                url = f"{public_url_base}/{BUCKET}/{storage_path}"
            else:
                supabase.storage.from_(BUCKET).upload(
                    path=storage_path,
                    file=data,
                    file_options={"content-type": "image/webp", "upsert": "true"},
                )
                url = supabase.storage.from_(BUCKET).get_public_url(storage_path)

            uploaded_urls.append(url)
            log.info(f"  Uploaded: {storage_path}")
        except Exception as exc:
            log.error(f"  Failed to upload {f.name}: {exc}")
            errors += 1

    if uploaded_urls:
        save_image_urls(project_id, uploaded_urls, supabase=supabase, db_conn=db_conn)
        log.info(f"  [{code}] Saved {len(uploaded_urls)} image URL(s) to DB")

    return len(uploaded_urls), errors


def main():
    parser = argparse.ArgumentParser(description="Upload Guidebook WebP images to MinIO or Supabase Storage")
    parser.add_argument("--source-dir", required=True, help="Root directory containing per-project WebP folders")
    parser.add_argument("--minio", action="store_true", help="Use MinIO (Docker) instead of Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be uploaded without doing it")
    parser.add_argument("--only", help="Comma-separated list of folder names to process (e.g. LDP42,IFF1)")
    args = parser.parse_args()

    source = Path(args.source_dir)
    if not source.is_dir():
        log.error(f"--source-dir '{source}' is not a valid directory")
        sys.exit(1)

    only_set = set(args.only.split(",")) if args.only else None
    folders = sorted([d for d in source.iterdir() if d.is_dir() and (only_set is None or d.name in only_set)])
    if not folders:
        log.error(f"No subdirectories found in '{source}'")
        sys.exit(1)

    log.info(f"Found {len(folders)} project folder(s) in '{source}'")
    if args.dry_run:
        log.info("DRY-RUN mode — no uploads or DB writes will occur")

    s3 = public_url_base = supabase = db_conn = None

    if args.minio:
        log.info("Storage: MinIO")
        s3, public_url_base = get_minio_client()
        db_conn = get_db_connection()
    else:
        log.info("Storage: Supabase")
        supabase = get_supabase_client()

    total_projects = total_images = total_errors = 0

    for folder in folders:
        images, errors = process_project_folder(
            folder, args.dry_run,
            s3=s3, public_url_base=public_url_base,
            supabase=supabase, db_conn=db_conn,
        )
        if images > 0:
            total_projects += 1
        total_images += images
        total_errors += errors

    if db_conn:
        db_conn.close()

    print("\n" + "=" * 50)
    print(f"  Projects processed : {total_projects}")
    print(f"  Images uploaded    : {total_images}")
    print(f"  Errors             : {total_errors}")
    print("=" * 50)

    if total_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
