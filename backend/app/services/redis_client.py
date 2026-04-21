import json
import logging

from redis.asyncio import Redis, from_url

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis: Redis | None = None
_redis_healthy: bool = True


def is_redis_healthy() -> bool:
    return _redis_healthy


async def get_redis() -> Redis:
    global _redis, _redis_healthy
    if _redis is None:
        try:
            _redis = await from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=2,  # 연결 타임아웃 2초
                socket_timeout=2,
            )
            await _redis.ping()
            _redis_healthy = True
        except Exception as e:
            _redis = None
            _redis_healthy = False
            logger.warning("Redis unavailable: %s", e)
            raise
    return _redis


async def close_redis() -> None:
    global _redis, _redis_healthy
    if _redis:
        await _redis.aclose()
        _redis = None
    _redis_healthy = False


async def get_issues_cached() -> list[dict] | None:
    global _redis_healthy
    try:
        redis = await get_redis()
        cached = await redis.get("issues:list")
        _redis_healthy = True
        return json.loads(cached) if cached else None
    except Exception:
        _redis_healthy = False
        return None


async def set_issues_cached(data: list[dict], ttl: int = 60) -> None:
    global _redis_healthy
    try:
        redis = await get_redis()
        await redis.setex("issues:list", ttl, json.dumps(data))
        _redis_healthy = True
    except Exception:
        _redis_healthy = False


async def invalidate_issues_cache() -> None:
    """alerts 이벤트 수신 시 캐시 즉시 무효화"""
    try:
        redis = await get_redis()
        await redis.delete("issues:list")
        logger.info("Issues cache invalidated")
    except Exception:
        pass
