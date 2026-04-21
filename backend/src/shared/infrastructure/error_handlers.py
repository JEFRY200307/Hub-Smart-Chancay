from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from src.shared.domain.exceptions import DomainException

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(DomainException)
    async def domain_exception_handler(request: Request, exc: DomainException):
        response_body = {
            "type": exc.type_uri,
            "title": exc.title,
            "status": exc.status_code,
            "detail": exc.detail,
        }
        if exc.instance:
            response_body["instance"] = exc.instance
        if exc.extensions:
            response_body.update(exc.extensions)
            
        return JSONResponse(
            status_code=exc.status_code,
            content=response_body,
            headers={"Content-Type": "application/problem+json"}
        )
