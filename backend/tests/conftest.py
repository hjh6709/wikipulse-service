import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt

from app.main import app

_MOCK_SECRET = "wikipulse-dev-secret"
_ALGORITHM = "HS256"


def make_token(sub: str = "test-user") -> str:
    return jwt.encode({"sub": sub, "username": sub}, _MOCK_SECRET, algorithm=_ALGORITHM)


@pytest_asyncio.fixture
async def client():
    # [비동기 FastAPI 통합 테스트용 클라이언트]
    # 실제 서버를 띄우지 않고 메모리상에서 FastAPI 앱과 통신하여 로직을 검증합니다.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {make_token()}"}