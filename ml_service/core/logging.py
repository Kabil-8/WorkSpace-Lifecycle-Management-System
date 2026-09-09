import time
import uuid
import logging
import json
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("edusphere.ml_service")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:10]}"
        request.state.request_id = request_id
        start_time = time.time()

        response = await call_next(request)

        latency_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = str(latency_ms)

        # Non-sensitive structured access log
        log_payload = {
            "requestId": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "latencyMs": latency_ms,
        }
        if response.status_code >= 400:
            logger.warning(json.dumps(log_payload))
        else:
            logger.info(json.dumps(log_payload))

        return response
