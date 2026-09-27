"""
Error handling definitions and exceptions for ML Gateway.
"""

from typing import Any, Dict, Optional


class GatewayException(Exception):
    """Base exception for all Gateway errors."""
    def __init__(
        self,
        message: str,
        model: str = "gateway",
        error_code: str = "INTERNAL_ERROR",
        retryable: bool = False,
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500
    ):
        super().__init__(message)
        self.message = message
        self.model = model
        self.error_code = error_code
        self.retryable = retryable
        self.details = details or {}
        self.status_code = status_code

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model": self.model,
            "error_code": self.error_code,
            "message": self.message,
            "retryable": self.retryable,
            "details": self.details,
        }


class ModelUnavailableException(GatewayException):
    def __init__(self, model: str, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        msg = message or f"{model} service is unavailable"
        super().__init__(
            message=msg,
            model=model,
            error_code="MODEL_UNAVAILABLE",
            retryable=True,
            details=details,
            status_code=503
        )


class ModelTimeoutException(GatewayException):
    def __init__(self, model: str, message: Optional[str] = None):
        msg = message or f"{model} request timed out"
        super().__init__(
            message=msg,
            model=model,
            error_code="MODEL_TIMEOUT",
            retryable=True,
            status_code=504
        )


class InvalidInputException(GatewayException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            model="gateway",
            error_code="INVALID_INPUT",
            retryable=False,
            details=details,
            status_code=400
        )


class SchemaMismatchException(GatewayException):
    def __init__(self, model: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            model=model,
            error_code="SCHEMA_MISMATCH",
            retryable=False,
            details=details,
            status_code=502
        )


class ModelInferenceException(GatewayException):
    def __init__(self, model: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            model=model,
            error_code="MODEL_INFERENCE_ERROR",
            retryable=False,
            details=details,
            status_code=500
        )
