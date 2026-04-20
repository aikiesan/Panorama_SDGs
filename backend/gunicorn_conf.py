import os

# Gunicorn config variables
# Use fewer workers for Railway's free tier (1GB RAM limit)
workers = int(os.environ.get("WEB_CONCURRENCY", "2"))
port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"
keepalive = 120
errorlog = "-"
accesslog = "-"
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
max_requests = 1000
max_requests_jitter = 50
