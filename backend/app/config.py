from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://aparthunt:aparthunt@localhost:5432/aparthunt"
    REDIS_URL: str = "redis://localhost:6379"

    ANTHROPIC_API_KEY: Optional[str] = None

    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: str = "alerts@aparthunt.app"

    GOOGLE_MAPS_API_KEY: Optional[str] = None
    SCRAPERAPI_KEY: Optional[str] = None

    CORS_ORIGIN: str = "http://localhost:3000"
    API_SECRET: Optional[str] = None  # shared secret frontend sends as X-API-Secret header

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
