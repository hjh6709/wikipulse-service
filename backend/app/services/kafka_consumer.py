import asyncio
import json
import logging
from collections.abc import AsyncGenerator

from aiokafka import AIOKafkaConsumer
from app.core.config import settings

logger = logging.getLogger(__name__)

# broadcast queue shared with WebSocket handler
_queue: asyncio.Queue[dict] = asyncio.Queue()


async def get_message_queue() -> asyncio.Queue[dict]:
    return _queue


async def _consume(topics: list[str]) -> None:
    for attempt in range(3):
        try:
            consumer = AIOKafkaConsumer(
                *topics,
                bootstrap_servers=settings.kafka_bootstrap_servers,
                group_id=settings.kafka_group_id,
                value_deserializer=lambda v: json.loads(v.decode()),
            )
            await consumer.start()
            break
        except Exception:
            logger.warning("Kafka connect attempt %d failed", attempt + 1)
            await asyncio.sleep(2)
    else:
        logger.error("Kafka unavailable — consumer not started")
        return

    try:
        async for msg in consumer:
            await _queue.put({"topic": msg.topic, "data": msg.value})
    finally:
        await consumer.stop()


async def start_consumer() -> None:
    if settings.use_mock:
        logger.info("Mock mode: Kafka consumer skipped")
        return
    asyncio.create_task(_consume(["sentiment-results", "briefings", "alerts"]))
