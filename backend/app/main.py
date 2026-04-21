from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, issues, users, websocket
from app.core.logging import setup_logging
from app.services.kafka_consumer import is_kafka_healthy, start_consumer
from app.services.redis_client import close_redis, is_redis_healthy

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_consumer()
    yield
    await close_redis()


app = FastAPI(title="WikiPulse API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(issues.router)
app.include_router(alerts.router)
app.include_router(users.router)
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "kafka": "ok" if is_kafka_healthy() else "unavailable",
        "redis": "ok" if is_redis_healthy() else "unavailable",
    }
