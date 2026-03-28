import asyncio
import json
import logging

import redis.asyncio as redis

from app.core.config import settings
from app.processing.pipeline import process_ingestion_job

logger = logging.getLogger(__name__)


async def worker_loop() -> None:
    client = redis.from_url(settings.redis_url, decode_responses=True)
    logger.info(
        "ingestion worker listening on %s", settings.ingestion_queue_name
    )
    try:
        while True:
            try:
                popped = await client.brpop(settings.ingestion_queue_name, timeout=5)
            except asyncio.CancelledError:
                break
            if popped is None:
                continue
            _, raw = popped
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                logger.warning("invalid job payload: %s", raw[:120])
                continue
            try:
                await process_ingestion_job(payload)
            except Exception:
                logger.exception("unhandled job failure")
    finally:
        await client.aclose()
        logger.info("ingestion worker stopped")
