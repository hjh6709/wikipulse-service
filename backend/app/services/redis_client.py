import json
from redis.asyncio import Redis, from_url
from app.core.config import settings

_redis: Redis | None = None


async def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = await from_url(settings.redis_url, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


async def get_issues_cached() -> list[dict] | None:
    try:
        redis = await get_redis()
        cached = await redis.get("issues:list")
        return json.loads(cached) if cached else None
    except Exception:
        return None


async def set_issues_cached(data: list[dict], ttl: int = 60) -> None:
    try:
        redis = await get_redis()
        await redis.setex("issues:list", ttl, json.dumps(data))
    except Exception:
        pass


async def invalidate_issues_cache() -> None:
    try:
        redis = await get_redis()
        await redis.delete("issues:list")
    except Exception:
        pass
