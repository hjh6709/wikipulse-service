import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth import get_current_user, get_optional_user
from app.core.config import settings
from app.schemas import Briefing, Issue, SentimentResult
from app.services.redis_client import get_issues_cached, set_issues_cached

router = APIRouter(prefix="/issues", tags=["issues"])

_MOCK_DIR = Path(__file__).parents[3] / "mock"


def _load_mock(filename: str) -> list[dict] | dict:
    path = _MOCK_DIR / filename
    return json.loads(path.read_text()) if path.exists() else []


_STATUSES = ["발생", "확산", "정점", "소강", "발생"]

_ARCHIVED_ITEMS = [
    ("ChatGPT 저작권 논란",      142, 2),
    ("2026 FIFA 월드컵 예선",     98,  5),
    ("애플 Vision Pro 2 발표",    230, 8),
    ("한국 총선 결과",            310, 10),
    ("OpenAI GPT-5 출시",        185, 35),
    ("테슬라 완전자율주행 승인",   77,  38),
    ("삼성 갤럭시 S26 공개",      260, 42),
    ("유럽 AI 규제법 통과",       53,  65),
    ("트위터 X 유료화 논란",      119, 68),
    ("넷플릭스 한국 오리지널",    44,  72),
]


def _mock_issues() -> list[dict]:
    return [
        {
            "issue_id": f"issue-{i}",
            "title": f"Mock Wikipedia Issue {i}",
            "edit_count": 10 * i,
            "spike_score": round(0.5 + i * 0.1, 2),
            "status": _STATUSES[i - 1],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        for i in range(1, 6)
    ]


def _mock_archived_issues() -> list[dict]:
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    return [
        {
            "issue_id": f"archived-{i + 1}",
            "title": title,
            "edit_count": edits,
            "spike_score": round(0.3 + i * 0.07, 2),
            "status": "소강",
            "updated_at": (now - timedelta(days=days_ago)).isoformat(),
        }
        for i, (title, edits, days_ago) in enumerate(_ARCHIVED_ITEMS)
    ]


@router.get("", response_model=list[Issue])
async def get_issues(
    preview: bool = Query(False),
    q: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(5, ge=1, le=50),
    _: dict | None = Depends(get_optional_user),
):
    cached = await get_issues_cached()
    data = cached or (_mock_issues() if settings.use_mock else [])
    if not cached:
        await set_issues_cached(data)
    if q:
        q_lower = q.lower()
        data = [d for d in data if q_lower in d.get("title", "").lower()]
    if preview:
        return data[:3]
    if cursor:
        ids = [d["issue_id"] for d in data]
        start = ids.index(cursor) + 1 if cursor in ids else 0
        data = data[start:]
    return data[:limit]


@router.get("/archived", response_model=list[Issue])
async def get_archived_issues(
    q: str | None = Query(None),
    _: dict = Depends(get_current_user),
):
    """소강 상태 이슈 목록 — /history 페이지용"""
    if settings.use_mock:
        data = _mock_archived_issues()
        if q:
            q_lower = q.lower()
            data = [d for d in data if q_lower in d.get("title", "").lower()]
        return data
    return []


@router.get("/{issue_id}", response_model=Issue)
async def get_issue(issue_id: str, _: dict = Depends(get_current_user)):
    if settings.use_mock:
        all_mock = _mock_issues() + _mock_archived_issues()
        for issue in all_mock:
            if issue["issue_id"] == issue_id:
                return issue
        return _mock_issues()[0] | {"issue_id": issue_id}
    raise HTTPException(status_code=404, detail="Issue not found")


@router.get("/{issue_id}/briefing", response_model=Briefing)
async def get_briefing(issue_id: str, _: dict = Depends(get_current_user)):
    if settings.use_mock:
        mock = _load_mock("briefings.json")
        item = mock if isinstance(mock, dict) else (mock[0] if mock else None)
        if item:
            return {**item, "issue_id": issue_id}
    raise HTTPException(status_code=404, detail="Briefing not found")


@router.get("/{issue_id}/sentiment", response_model=list[SentimentResult])
async def get_sentiment(issue_id: str, _: dict = Depends(get_current_user)):
    if settings.use_mock:
        mock = _load_mock("sentiment-results.json")
        items = mock if isinstance(mock, list) else [mock]
        return [{**item, "issue_id": issue_id} for item in items]
    return []


@router.get("/{issue_id}/timeline")
async def get_timeline(issue_id: str, _: dict = Depends(get_current_user)):
    if settings.use_mock:
        events = _load_mock("timeline.json")
        items = events if isinstance(events, list) else [events]
        return {"issue_id": issue_id, "events": [{**e, "issue_id": issue_id} for e in items]}
    return {"issue_id": issue_id, "events": []}
