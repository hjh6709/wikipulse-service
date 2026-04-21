"""E2E scenario tests for issues API (mock mode)."""
import pytest


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "kafka" in data


@pytest.mark.asyncio
async def test_get_issues_no_auth_returns_all(client):
    """/issues 는 get_optional_user — 인증 없어도 전체 반환 (preview 아닐 때)"""
    r = await client.get("/issues")
    assert r.status_code == 200
    assert len(r.json()) == 5


@pytest.mark.asyncio
async def test_get_issues_with_auth(client, auth_headers):
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
    r = await client.get("/issues?q=Issue+1", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert "1" in data[0]["title"]


@pytest.mark.asyncio
async def test_issue_search_no_match(client, auth_headers):
    r = await client.get("/issues?q=존재하지않는키워드", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_get_issues_preview_no_auth(client):
    """랜딩 페이지 비로그인 미리보기: 인증 없이 상위 3개만 반환"""
    r = await client.get("/issues?preview=true")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3


@pytest.mark.asyncio
async def test_get_issues_preview_with_auth(client, auth_headers):
    """preview=true 는 인증 있어도 3개만"""
    r = await client.get("/issues?preview=true", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 3


@pytest.mark.asyncio
async def test_get_archived_issues(client, auth_headers):
    r = await client.get("/issues/archived", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3
    assert all(d["status"] == "소강" for d in data)


@pytest.mark.asyncio
async def test_get_archived_issues_search(client, auth_headers):
    r = await client.get("/issues/archived?q=Issue+1", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


@pytest.mark.asyncio
async def test_get_archived_requires_auth(client):
    r = await client.get("/issues/archived")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_briefing(client, auth_headers):
    r = await client.get("/issues/issue-1/briefing", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "summary" in data
    assert "key_points" in data
    assert data["issue_id"] == "issue-1"


@pytest.mark.asyncio
async def test_get_briefing_requires_auth(client):
    r = await client.get("/issues/issue-1/briefing")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_get_sentiment(client, auth_headers):
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
