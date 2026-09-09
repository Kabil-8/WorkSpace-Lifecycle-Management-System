import pytest
from fastapi import HTTPException
from core.security import verify_service_auth
from core.config import settings

def test_verify_service_auth_dev_mode():
    # In dev mode when secret is not configured, it returns True
    orig = settings.ML_SERVICE_SECRET
    try:
        settings.ML_SERVICE_SECRET = None
        assert verify_service_auth(x_service_key=None, authorization=None) is True
    finally:
        settings.ML_SERVICE_SECRET = orig

def test_verify_service_auth_with_valid_key():
    orig = settings.ML_SERVICE_SECRET
    try:
        settings.ML_SERVICE_SECRET = "secret_key_12345"
        assert verify_service_auth(x_service_key="secret_key_12345") is True
        assert verify_service_auth(authorization="Bearer secret_key_12345") is True
    finally:
        settings.ML_SERVICE_SECRET = orig

def test_verify_service_auth_with_invalid_key_raises_401():
    orig = settings.ML_SERVICE_SECRET
    try:
        settings.ML_SERVICE_SECRET = "secret_key_12345"
        with pytest.raises(HTTPException) as exc_info:
            verify_service_auth(x_service_key="wrong_secret")
        assert exc_info.value.status_code == 401
    finally:
        settings.ML_SERVICE_SECRET = orig

def test_verify_service_auth_production_without_secret_fails_closed():
    orig_env = settings.ENVIRONMENT
    orig_sec = settings.ML_SERVICE_SECRET
    try:
        settings.ENVIRONMENT = "production"
        settings.ML_SERVICE_SECRET = None
        with pytest.raises(HTTPException) as exc_info:
            verify_service_auth()
        assert exc_info.value.status_code == 401
        assert "Fail-Closed" in exc_info.value.detail["error"]["message"]
    finally:
        settings.ENVIRONMENT = orig_env
        settings.ML_SERVICE_SECRET = orig_sec

