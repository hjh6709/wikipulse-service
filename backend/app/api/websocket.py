import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.auth import verify_jwt
from app.core.config import settings
from app.services.kafka_consumer import get_message_queue

router = APIRouter(tags=["websocket"])

_MOCK_DIR = Path(__file__).parents[4] / "mock"

_connected: set[WebSocket] = set()


async def _mock_stream(ws: WebSocket) -> None:
    """Replays mock JSON files on a loop for local dev."""
    files = ["sentiment-results.json", "briefings.json", "alerts.json"]
    type_map = {
        "sentiment-results.json": "sentiment",
        "briefings.json": "briefing",
        "alerts.json": "spike",
    }
    while True:
        for fname in files:
            path = _MOCK_DIR / fname
            if path.exists():
                data = json.loads(path.read_text())
                payload = {"type": type_map[fname], "data": data if isinstance(data, dict) else data[0]}
                try:
                    await ws.send_json(payload)
                except WebSocketDisconnect:
                    return
            await asyncio.sleep(3)


@router.websocket("/ws/issues")
async def issue_stream(websocket: WebSocket, token: str = Query(...)):
    verify_jwt(token)
    await websocket.accept()
    _connected.add(websocket)
    try:
        if settings.use_mock:
            await _mock_stream(websocket)
        else:
            queue = await get_message_queue()
            while True:
                msg = await queue.get()
                await websocket.send_json(msg)
    except WebSocketDisconnect:
        pass
    finally:
        _connected.discard(websocket)
