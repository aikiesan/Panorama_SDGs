from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import logging
from .core.config import settings
from .core.limiter import limiter
from .api import auth, projects, dashboard, admin

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Panorama SDG API",
    description="API for the UIA Panorama SDG sustainable development projects platform",
    version="0.1.0",
)

# Rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
cors_kwargs = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "expose_headers": ["*"],
}

# Add explicit origins if configured
origins_list = settings.cors_origins_list
if settings.ENVIRONMENT == "development":
    # In development, be permissive to avoid local blocks
    cors_kwargs["allow_origins"] = ["*"]
    logger.info("CORS: Development mode - allowing all origins")
elif origins_list:
    cors_kwargs["allow_origins"] = origins_list
    logger.info(f"CORS allowed origins: {origins_list}")
else:
    logger.warning("No CORS_ORIGINS configured! CORS may not work.")

# Add regex pattern if configured (useful for Vercel preview deployments)
if settings.CORS_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.CORS_ORIGIN_REGEX
    logger.info(f"CORS origin regex: {settings.CORS_ORIGIN_REGEX}")

# Ensure at least one CORS configuration is set
if not origins_list and not settings.CORS_ORIGIN_REGEX:
    logger.error("WARNING: No CORS configuration set! API will reject all cross-origin requests.")
    # Fallback to localhost for safety
    cors_kwargs["allow_origins"] = ["http://localhost:5173"]

logger.info(f"Final CORS configuration: {cors_kwargs}")
app.add_middleware(CORSMiddleware, **cors_kwargs)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inject security response headers on every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com http://localhost:9000 blob:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'"
    )
    return response


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Panorama SDG API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
