from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.database import init_db
from app.limiter import limiter
from app.config import settings
from app.routers import listings, alerts, chat, neighborhoods

app = FastAPI(title="ApartHunt API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def verify_api_secret(request: Request, call_next):
    if settings.API_SECRET and request.url.path != "/health":
        if request.headers.get("X-API-Secret") != settings.API_SECRET:
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return await call_next(request)

app.include_router(listings.router)
app.include_router(alerts.router)
app.include_router(chat.router)
app.include_router(neighborhoods.router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}
