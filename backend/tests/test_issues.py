"""E2E scenario tests for issues API (mock mode)."""
import pytest


@pytest.mark.asyncio
async def test_health(client):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 서버 상태와 Kafka 연결이 정상인지 확인합니다."""
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "kafka" in data


@pytest.mark.asyncio
async def test_get_issues_no_auth_returns_all(client):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 인증 없이도 전체 이슈 목록이 정상 반환되는지 확인합니다."""
    r = await client.get("/issues")
    assert r.status_code == 200
    assert len(r.json()) == 5


@pytest.mark.asyncio
async def test_get_issues_with_auth(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 로그인 유저에게 상세 데이터(상태, 점수 등)가 정확히 오는지 검증합니다."""
    r = await client.get("/issues", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 5
    issue = data[0]
    assert "issue_id" in issue
    assert "title" in issue
    assert "edit_count" in issue
    assert "spike_score" in issue
    assert issue["status"] in ("발생", "확산", "정점", "소강")


@pytest.mark.asyncio
async def test_issue_search(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 키워드 검색 시 해당 이슈만 필터링되는지 확인합니다."""
    r = await client.get("/issues?q=Issue+1", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert "1" in data[0]["title"]


@pytest.mark.asyncio
async def test_issue_search_no_match(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 검색 결과가 없을 때 빈 리스트를 주는지 확인합니다."""
    r = await client.get("/issues?q=존재하지않는키워드", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_get_issues_preview_no_auth(client):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 비로그인 미리보기 시 상위 3개만 반환하는지 확인합니다."""
    r = await client.get("/issues?preview=true")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3


@pytest.mark.asyncio
async def test_get_issues_preview_with_auth(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 로그인 상태여도 preview=true면 3개만 주는지 검증합니다."""
    r = await client.get("/issues?preview=true", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 3


@pytest.mark.asyncio
async def test_get_archived_issues(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] '소강' 상태의 아카이브 이슈들만 가져오는지 확인합니다."""
    r = await client.get("/issues/archived", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3
    assert all(d["status"] == "소강" for d in data)


@pytest.mark.asyncio
async def test_get_archived_issues_search(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 아카이브 메뉴 내에서의 검색 기능이 정상인지 확인합니다."""
    r = await client.get("/issues/archived?q=Issue+1", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


@pytest.mark.asyncio
async def test_get_archived_requires_auth(client):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 아카이브 메뉴 접근 시 로그인이 필수인지(401) 확인합니다."""
    r = await client.get("/issues/archived")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_briefing(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 특정 이슈의 AI 요약 브리핑 데이터를 가져오는지 확인합니다."""
    r = await client.get("/issues/issue-1/briefing", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "summary" in data
    assert "key_points" in data
    assert data["issue_id"] == "issue-1"


@pytest.mark.asyncio
async def test_get_briefing_requires_auth(client):
    """[비동기 FastAPI 통합 테스트용 클라이언트] AI 브리핑 데이터 접근 시 로그인이 필수인지 검증합니다."""
    r = await client.get("/issues/issue-1/briefing")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_sentiment(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 이슈 감성 분석 결과의 필드 구조를 통합 검증합니다."""
    r = await client.get("/issues/issue-1/sentiment", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0
    item = data[0]
    assert "sentiment" in item
    assert item["sentiment"] in ("positive", "negative", "neutral")
    assert "sentiment_score" in item
    assert item["issue_id"] == "issue-1"


@pytest.mark.asyncio
async def test_get_timeline(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 이슈 타임라인 이벤트들이 시간순으로 잘 오는지 확인합니다."""
    r = await client.get("/issues/issue-1/timeline", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["issue_id"] == "issue-1"
    assert "events" in data
    events = data["events"]
    assert len(events) > 0
    event = events[0]
    assert "event_id" in event
    assert "type" in event
    assert event["type"] in ("spike", "reddit", "sentiment", "briefing")
    assert "timestamp" in event