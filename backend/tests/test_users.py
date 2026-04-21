"""User API tests: /users/me, /users/bookmarks, /users/preferences"""
import pytest


@pytest.mark.asyncio
async def test_get_me(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 내 정보를 정상적으로 가져오는지 확인합니다."""
    r = await client.get("/users/me", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "user_id" in data
    assert "username" in data
    assert "email" in data


@pytest.mark.asyncio
async def test_get_me_requires_auth(client):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 인증 정보가 없을 때 401 에러를 반환하는지 확인합니다."""
    r = await client.get("/users/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_patch_me(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 사용자 정보를 수정했을 때 정상 반영되는지 확인합니다."""
    r = await client.patch("/users/me", json={"username": "newname"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["username"] == "newname"


@pytest.mark.asyncio
async def test_bookmarks_crud(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 북마크의 생성, 조회, 삭제 흐름을 통합 검증합니다."""
    # 초기 빈 목록
    r = await client.get("/users/bookmarks", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []

    # 북마크 추가
    r = await client.post("/users/bookmarks", json={"issue_id": "issue-1"}, headers=auth_headers)
    assert r.status_code == 201
    bookmark_id = r.json()["bookmark_id"]
    assert r.json()["issue_id"] == "issue-1"

    # 목록 조회
    r = await client.get("/users/bookmarks", headers=auth_headers)
    assert len(r.json()) == 1

    # 삭제
    r = await client.delete(f"/users/bookmarks/{bookmark_id}", headers=auth_headers)
    assert r.status_code == 204

    # 삭제 후 빈 목록
    r = await client.get("/users/bookmarks", headers=auth_headers)
    assert r.json() == []


@pytest.mark.asyncio
async def test_preferences(client, auth_headers):
    """[비동기 FastAPI 통합 테스트용 클라이언트] 사용자 카테고리 선호도 저장 및 조회 로직을 확인합니다."""
    # 초기 빈 목록
    r = await client.get("/users/preferences", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["categories"] == []

    # 저장
    categories = ["정치", "경제", "스포츠"]
    r = await client.post("/users/preferences", json={"categories": categories}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["categories"] == categories

    # 조회
    r = await client.get("/users/preferences", headers=auth_headers)
    assert r.json()["categories"] == categories