from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Database
    DATABASE_URL: str

    # MinIO / S3-compatible image storage
    MINIO_ENDPOINT: str = ""
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET: str = "project-images"
    MINIO_PUBLIC_URL: str = ""

    # Security
    SECRET_KEY: str = "dev-secret-key-please-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    RECAPTCHA_SECRET_KEY: str = "placeholder-recaptcha-key"
    ENABLE_RECAPTCHA: bool = False

    # Email (optional - will log errors if not configured)
    SMTP_HOST: str = "smtp.sendgrid.net"
    SMTP_PORT: int = 587
    SMTP_USER: str = "apikey"
    SMTP_PASSWORD: str = "placeholder-password"
    SMTP_FROM_EMAIL: str = "noreply@panorama-sdg.org"
    SMTP_FROM_NAME: str = "Panorama SDG"

    # Admin
    ADMIN_EMAIL: str = "admin@uia.org"
    ADMIN_API_KEY: str = "change-me-in-production"

    # Image base URL (MinIO public endpoint)
    IMAGE_BASE_URL: str = "http://localhost:9000/project-images"

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"
    # Optional: Regex pattern for allowed origins (e.g., for Vercel preview deployments)
    # Example: r"https://.*\.vercel\.app"
    CORS_ORIGIN_REGEX: str = r"https://.*\.vercel\.app"

    # Environment
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()