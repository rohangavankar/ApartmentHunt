from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery = Celery(
    "aparthunt",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"],
)

celery.conf.beat_schedule = {
    # Scrape StreetEasy every hour
    "scrape-streeteasy": {
        "task": "app.workers.tasks.scrape_streeteasy",
        "schedule": 3600,
    },
    # Check for new listings and send alerts every 30 minutes
    "check-alerts": {
        "task": "app.workers.tasks.check_and_send_alerts",
        "schedule": 1800,
    },
}

celery.conf.timezone = "America/New_York"
