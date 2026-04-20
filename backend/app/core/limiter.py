import os
import uuid
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request


def _get_rate_limit_key(request: Request) -> str:
    """Return unique key per request in test mode (disables effective rate limiting)."""
    if os.environ.get("TESTING") == "1":
        return str(uuid.uuid4())
    return get_remote_address(request)


limiter = Limiter(key_func=_get_rate_limit_key)
