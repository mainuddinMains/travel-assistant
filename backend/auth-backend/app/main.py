import logging
from time import perf_counter
from fastapi import FastAPI, Depends, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import DEFAULT_ALLOWED_ORIGINS, settings
from app.db.session import get_session
from app.api.v1 import api_router

logger = logging.getLogger(__name__)

app = FastAPI(title="Travel Assistant Auth API", version="1.0.0")

# Ensure CORS origins are properly set
if not settings.ALLOWED_ORIGINS:
    settings.ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS.copy()

# CORS Middleware MUST be added FIRST (before any other middleware)
# FastAPI executes middleware in reverse order, so this will be executed last
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
    expose_headers=settings.CORS_EXPOSE_HEADERS,
    max_age=settings.CORS_MAX_AGE,
)

# Log CORS configuration on startup
logger.info(
    "CORS configured",
    extra={
        "origins": settings.ALLOWED_ORIGINS,
        "methods": settings.CORS_ALLOW_METHODS,
        "headers": settings.CORS_ALLOW_HEADERS,
        "expose_headers": settings.CORS_EXPOSE_HEADERS,
        "credentials": settings.CORS_ALLOW_CREDENTIALS,
        "max_age": settings.CORS_MAX_AGE,
    },
)


def add_cors_headers(response: Response, origin: str | None) -> Response:
    """Add CORS headers to response if origin is allowed."""
    if origin and origin in settings.ALLOWED_ORIGINS:
        response.headers["access-control-allow-origin"] = origin
        if settings.CORS_ALLOW_CREDENTIALS:
            response.headers["access-control-allow-credentials"] = "true"
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions and ensure CORS headers are present."""
    origin = request.headers.get("origin")
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
    return add_cors_headers(response, origin)


@app.exception_handler(StarletteHTTPException)
async def starlette_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle Starlette HTTP exceptions and ensure CORS headers are present."""
    origin = request.headers.get("origin")
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
    return add_cors_headers(response, origin)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors and ensure CORS headers are present."""
    origin = request.headers.get("origin")
    response = JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )
    return add_cors_headers(response, origin)


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions and ensure CORS headers are present."""
    logger.exception("Unhandled exception", exc_info=exc)
    origin = request.headers.get("origin")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
    return add_cors_headers(response, origin)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and responses, including CORS headers."""
    start = perf_counter()
    origin = request.headers.get("origin")
    
    logger.debug(
        "Incoming request",
        extra={
            "method": request.method,
            "url": str(request.url),
            "origin": origin,
            "path": request.url.path,
        },
    )
    
    response = await call_next(request)
    duration_ms = (perf_counter() - start) * 1000
    
    # Ensure CORS headers are present even if middleware didn't add them
    response = add_cors_headers(response, origin)
    
    # Log CORS headers in response
    cors_headers = {
        "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
        "access-control-allow-credentials": response.headers.get("access-control-allow-credentials"),
        "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
        "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
    }
    
    logger.debug(
        "Outgoing response",
        extra={
            "status_code": response.status_code,
            "method": request.method,
            "url": str(request.url),
            "duration_ms": f"{duration_ms:.2f}ms",
            "cors_headers": cors_headers,
        },
    )
    
    return response


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/healthz/db")
async def healthz_db(session: AsyncSession = Depends(get_session)):
    await session.execute(text("SELECT 1"))
    return {"db": "ok"}


# Include API routers
app.include_router(api_router, prefix=settings.API_PREFIX)
