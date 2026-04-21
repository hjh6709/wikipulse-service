"""WebSocket E2E scenario tests."""
import pytest
from jose import jwt
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app

_MOCK_SECRET = "wikipulse-dev-secret"
_ALGORITHM = "HS256"


def make_token(sub: str = "test-user") -> str:
    return jwt.encode({"sub": sub, "username": sub}, _MOCK_SECRET, algorithm=_ALGORITHM)


def test_ws_no_token_rejected():
    """[비동기 FastAPI 통합 테스트용 클라이언트] 토큰이 없을 때 연결이 거절되는지 확인합니다."""
    client = TestClient(app, raise_server_exceptions=False)
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/issues"):
            pass


def test_ws_invalid_token_rejected():
    """[비동기 FastAPI 통합 테스트용 클라이언트] 잘못된 토큰 사용 시 1008 코드로 연결이 끊기는지 확인합니다."""
    client = TestClient(app, raise_server_exceptions=False)
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/ws/issues?token=bad-token"):
            pass
    assert exc_info.value.code == 1008


def test_ws_receives_messages():
    """[비동기 FastAPI 통합 테스트용 클라이언트] 실시간 메시지 수신의 데이터 구조를 검증합니다."""
    token = make_token()
    client = TestClient(app)
    with client.websocket_connect(f"/ws/issues?token={token}") as ws:
        msg = ws.receive_json()
        assert "type" in msg
        assert msg["type"] in ("sentiment", "briefing", "spike", "comment")
        assert "data" in msg
        assert isinstance(msg["data"], dict)