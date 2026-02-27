from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./travel_assistant.db", description="SQLAlchemy async URL, e.g. postgresql+asyncpg://user:pass@host:5432/db")

    # API
    API_PREFIX: str = "/api/v1"
    ENV: str = "dev"
    LOG_LEVEL: str = "INFO"

    # CORS
    ALLOWED_ORIGINS: str | list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"],
        description="Comma-separated list or JSON list of allowed origins",
    )
    CORS_ALLOWED_ORIGINS: str | list[str] | None = Field(
        default=None,
        description="Optional override for CORS allowed origins",
    )
    CORS_ALLOW_METHODS: str | list[str] = Field(
        default_factory=lambda: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        description="Allowed HTTP methods for CORS",
    )
    CORS_ALLOW_HEADERS: str | list[str] = Field(
        default_factory=lambda: ["Content-Type", "Authorization", "X-Requested-With"],
        description="Allowed HTTP headers for CORS",
    )
    CORS_EXPOSE_HEADERS: str | list[str] = Field(
        default_factory=lambda: ["Set-Cookie", "Authorization"],
        description="Headers exposed to the browser",
    )
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True, description="Allow credentials in CORS responses")
    CORS_MAX_AGE: int = Field(default=3600, description="Preflight cache max age in seconds")

    # JWT Settings
    SECRET_KEY: str = Field(..., description="Secret key for JWT signing")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, description="Access token expiration in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiration in days")

    # Auth cookies
    REFRESH_TOKEN_COOKIE_NAME: str = Field(default="refresh", description="Cookie name for refresh token")
    AUTH_COOKIE_SECURE: bool = Field(default=False, description="Mark auth cookies as secure (HTTPS only)")
    AUTH_COOKIE_SAMESITE: str = Field(default="lax", description="SameSite attribute for auth cookies")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra='ignore'  # Silently ignore extra fields like chatgpt_api_key
    )


def _as_list(v: str | list[str]) -> list[str]:
    if isinstance(v, list):
        return v
    # split comma-separated string
    return [s.strip() for s in v.split(",") if s.strip()]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    # Normalize list-like settings
    settings.ALLOWED_ORIGINS = _as_list(settings.CORS_ALLOWED_ORIGINS or settings.ALLOWED_ORIGINS)
    settings.CORS_ALLOW_METHODS = _as_list(settings.CORS_ALLOW_METHODS)
    settings.CORS_ALLOW_HEADERS = _as_list(settings.CORS_ALLOW_HEADERS)
    settings.CORS_EXPOSE_HEADERS = _as_list(settings.CORS_EXPOSE_HEADERS)
    return settings


# Singleton-style export for convenience
settings = get_settings()

