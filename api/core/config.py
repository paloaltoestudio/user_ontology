from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration"""

    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SaaS Registration Engine"
    DEBUG: bool = False

    # Database (SQLite for dev, PostgreSQL for prod)
    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"
    DATABASE_ECHO: bool = False

    # JWT Settings
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS Settings
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:3003"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # Password Settings
    PASSWORD_MIN_LENGTH: int = 8

    # External Services
    N8N_WEBHOOK_URL: Optional[str] = None
    N8N_API_KEY: Optional[str] = None

    # Admin Setup
    ADMIN_SETUP_KEY: str = "change-me-in-production"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
