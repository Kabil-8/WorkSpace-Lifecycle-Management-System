import secrets
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from core.config import settings

def verify_service_auth(
    x_service_key: Optional[str] = Header(None, alias="X-Service-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> bool:
    """
    Validates service-to-service authentication from Node.js backend.
    Enforces secret checking when ML_SERVICE_SECRET is configured.
    """
    secret = settings.ML_SERVICE_SECRET
    if not secret:
        if settings.ENVIRONMENT == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Production environment requires ML_SERVICE_SECRET configuration (Fail-Closed Enforcement)."
                    }
                }
            )
        # Development mode or local internal network: allow request
        return True

    token = x_service_key if isinstance(x_service_key, str) else None
    if not token and isinstance(authorization, str):
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    if not token or not secrets.compare_digest(token, secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Invalid or missing service authentication token."
                }
            }
        )
    return True
