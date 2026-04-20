import boto3
from botocore.client import Config
from .config import settings


def _get_s3_client():
    if not settings.MINIO_ENDPOINT:
        raise RuntimeError(
            "MINIO_ENDPOINT is not configured. "
            "Set it in docker-compose.yml or your .env file."
        )
    return boto3.client(
        "s3",
        endpoint_url=settings.MINIO_ENDPOINT,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def upload_file(content: bytes, file_path: str, content_type: str) -> str:
    """Upload bytes to MinIO. Raises RuntimeError if MinIO is not configured."""
    s3 = _get_s3_client()
    s3.put_object(
        Bucket=settings.MINIO_BUCKET,
        Key=file_path,
        Body=content,
        ContentType=content_type,
    )
    return f"{settings.MINIO_PUBLIC_URL}/{settings.MINIO_BUCKET}/{file_path}"
