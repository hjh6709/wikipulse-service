import json
import logging

import boto3
from app.core.config import settings

logger = logging.getLogger(__name__)


async def trigger_alert(payload: dict) -> None:
    try:
        client = boto3.client("lambda", region_name=settings.aws_region)
        client.invoke(
            FunctionName=settings.lambda_function_name,
            InvocationType="Event",
            Payload=json.dumps(payload).encode(),
        )
    except Exception as e:
        logger.error("Lambda trigger failed: %s", e)
