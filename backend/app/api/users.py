from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas import Bookmark, UserPreferences, UserSettings, UserSettingsPatch

router = APIRouter(prefix="/users", tags=["users"])

# Week 5: in-memory store (영구 DB 미확정 — 김용균 확인 후 PostgreSQL 교체)
_bookmarks: dict[str, list[dict]] = {}
_preferences: dict[str, list[str]] = {}


@router.get("/me", response_model=UserSettings)
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user.get("sub", ""),
        "username": user.get("username", user.get("sub", "")),
        "email": user.get("email", ""),
    }


@router.patch("/me", response_model=UserSettings)
async def patch_me(body: UserSettingsPatch, user: dict = Depends(get_current_user)):
    # mock: 요청값 그대로 반환 (실제 DB 없음)
    return {
        "user_id": user.get("sub", ""),
        "username": body.username or user.get("username", user.get("sub", "")),
        "email": body.email or user.get("email", ""),
    }


@router.get("/bookmarks", response_model=list[Bookmark])
async def get_bookmarks(user: dict = Depends(get_current_user)):
    uid = user.get("sub", "")
    return _bookmarks.get(uid, [])


@router.post("/bookmarks", response_model=Bookmark, status_code=201)
async def add_bookmark(body: dict, user: dict = Depends(get_current_user)):
    uid = user.get("sub", "")
    bookmark = {
        "bookmark_id": str(uuid4()),
        "issue_id": body["issue_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _bookmarks.setdefault(uid, []).append(bookmark)
    return bookmark


@router.delete("/bookmarks/{bookmark_id}", status_code=204)
async def delete_bookmark(bookmark_id: str, user: dict = Depends(get_current_user)):
    uid = user.get("sub", "")
    _bookmarks[uid] = [b for b in _bookmarks.get(uid, []) if b["bookmark_id"] != bookmark_id]


@router.get("/preferences", response_model=UserPreferences)
async def get_preferences(user: dict = Depends(get_current_user)):
    uid = user.get("sub", "")
    return {"categories": _preferences.get(uid, [])}


@router.post("/preferences", response_model=UserPreferences)
async def save_preferences(body: UserPreferences, user: dict = Depends(get_current_user)):
    uid = user.get("sub", "")
    _preferences[uid] = body.categories
    return body
