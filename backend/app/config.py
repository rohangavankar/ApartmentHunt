from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://aparthunt:aparthunt@localhost:5432/aparthunt"
    REDIS_URL: str = "redis://localhost:6379"

    ANTHROPIC_API_KEY: Optional[str] = None

    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: str = "alerts@aparthunt.app"

    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_PHONE: Optional[str] = None

    GOOGLE_MAPS_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
