from typing import Any, Dict, Optional

class DomainException(Exception):
    def __init__(
        self,
        title: str,
        detail: str,
        status_code: int = 400,
        type_uri: str = "about:blank",
        instance: Optional[str] = None,
        extensions: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(detail)
        self.title = title
        self.detail = detail
        self.status_code = status_code
        self.type_uri = type_uri
        self.instance = instance
        self.extensions = extensions or {}

class ResourceNotFoundException(DomainException):
    def __init__(self, resource_name: str, resource_id: str):
        super().__init__(
            title="Resource Not Found",
            detail=f"{resource_name} with id {resource_id} was not found.",
            status_code=404,
            type_uri="https://api.chancaygateway.gob.pe/errors/not-found"
        )
