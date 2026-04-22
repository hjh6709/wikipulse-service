import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer
from app.core.config import settings

logger = logging.getLogger(__name__)

_queue: asyncio.Queue[dict] = asyncio.Queue()
_kafka_healthy: bool = True  # WebSocket/API에서 읽어 프론트엔드에 전달
_comments: dict[str, dict] = {}  # comment_id → reddit-comments 원본 (sentiment 매칭용)


async def get_message_queue() -> asyncio.Queue[dict]:
    return _queue


def is_kafka_healthy() -> bool:
    return _kafka_healthy


async def _consume(topics: list[str]) -> None:
    global _kafka_healthy

    for attempt in range(3):
        try:
            consumer = AIOKafkaConsumer(
                *topics,
                bootstrap_servers=settings.kafka_bootstrap_servers,
                group_id=settings.kafka_group_id,
                value_deserializer=lambda v: json.loads(v.decode()),
            )
            await consumer.start()
            _kafka_healthy = True
            logger.info("Kafka consumer started")
            break
        except Exception:
            logger.warning("Kafka connect attempt %d/3 failed", attempt + 1)
            await asyncio.sleep(2)
    else:
        _kafka_healthy = False
        logger.error("Kafka unavailable after 3 attempts — consumer not started")
        return

    try:
        async for msg in consumer:
            value: dict = msg.value if isinstance(msg.value, dict) else {}

            if msg.topic == "reddit-comments":
                comment_id = value.get("comment_id")
                if comment_id:
                    _comments[comment_id] = value
                await _queue.put({"topic": "comment", "data": value})

            elif msg.topic == "sentiment-results":
                comment_id = value.get("comment_id")
                if comment_id and comment_id in _comments:
                    merged = {**_comments[comment_id], **value}
                    await _queue.put({"topic": "comment", "data": merged})
                else:
                    await _queue.put({"topic": "sentiment", "data": value})

            else:
                await _queue.put({"topic": msg.topic, "data": value})

            if msg.topic == "alerts":
                from app.services.redis_client import invalidate_issues_cache
                await invalidate_issues_cache()
    except Exception as e:
        _kafka_healthy = False
        logger.error("Kafka consumer error: %s", e)
    finally:
        await consumer.stop()


async def start_consumer() -> None:
    if settings.use_mock:
        logger.info("Mock mode: Kafka consumer skipped")
        return
    asyncio.create_task(_consume(["sentiment-results", "briefings", "alerts", "reddit-comments"]))
