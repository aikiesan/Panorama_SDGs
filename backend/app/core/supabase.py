# Supabase has been removed. This project uses PostgreSQL + MinIO exclusively.
# This file is kept as a placeholder to avoid import errors during transition.
# It can be deleted once all references have been cleaned up.

def get_supabase_client():
    raise RuntimeError(
        "Supabase has been removed from this project. "
        "Use MinIO for storage (MINIO_ENDPOINT in .env)."
    )
