from typing import Optional, List, Dict, Any
from fastapi import Request, status
from fastapi.responses import JSONResponse

class MLErrorCode:
    INVALID_INPUT = "INVALID_INPUT"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    DEPENDENCY_UNAVAILABLE = "DEPENDENCY_UNAVAILABLE"
    PREDICTION_FAILED = "PREDICTION_FAILED"
    TRAINING_FAILED = "TRAINING_FAILED"
    INTERNAL_ERROR = "INTERNAL_ERROR"

class MLServiceException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        missing_features: Optional[List[str]] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.missing_features = missing_features or []
        self.details = details or {}

class InsufficientDataError(MLServiceException):
    def __init__(self, message: str = "Insufficient verified student data for this prediction.", missing_features: Optional[List[str]] = None):
        super().__init__(
            code=MLErrorCode.INSUFFICIENT_DATA,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            missing_features=missing_features
        )

class InvalidInputError(MLServiceException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code=MLErrorCode.INVALID_INPUT,
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )

class ModelUnavailableError(MLServiceException):
    def __init__(self, model_name: str):
        super().__init__(
            code=MLErrorCode.MODEL_UNAVAILABLE,
            message=f"Requested model '{model_name}' is currently unavailable or uninitialized.",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )

class UnauthorizedError(MLServiceException):
    def __init__(self, message: str = "Unauthorized service access. Valid service authentication credentials required."):
        super().__init__(
            code=MLErrorCode.UNAUTHORIZED,
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )

def format_error_response(
    code: str,
    message: str,
    request_id: str = "req-untracked",
    missing_features: Optional[List[str]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> JSONResponse:
    payload: Dict[str, Any] = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "requestId": request_id,
        }
    }
    if missing_features:
        payload["error"]["missingFeatures"] = missing_features
    return JSONResponse(status_code=status_code, content=payload)
