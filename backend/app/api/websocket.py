import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from fastapi.exceptions import HTTPException

from app.core.auth import verify_jwt
from app.core.config import settings
from app.services.kafka_consumer import get_message_queue

router = APIRouter(tags=["websocket"])

_MOCK_DIR = Path(__file__).parents[3] / "mock"

_connected: set[WebSocket] = set()


async def _mock_stream(ws: WebSocket) -> None:
    """Replays mock JSON files on a loop for local dev."""
    files = ["sentiment-results.json", "briefings.json", "alerts.json", "comments.json"]
    type_map = {
        "sentiment-results.json": "sentiment",
        "briefings.json": "briefing",
        "alerts.json": "spike",
        "comments.json": "comment",
    }
    counters: dict[str, int] = {f: 0 for f in files}
    while True:
        for fname in files:
            path = _MOCK_DIR / fname
            if path.exists():
                data = json.loads(path.read_text())
                if isinstance(data, list):
                    item = data[counters[fname] % len(data)]
                    counters[fname] += 1
                else:
                    item = data
                try:
                    await ws.send_json({"type": type_map[fname], "data": item})
                except WebSocketDisconnect:
                    return
            await asyncio.sleep(3)


@router.websocket("/ws/issues")
async def issue_stream(websocket: WebSocket, token: str = Query(...)):
    try:
        verify_jwt(token)
    except HTTPException:
        await websocket.close(code=1008)
        return
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
