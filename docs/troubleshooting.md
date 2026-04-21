# WikiPulse — 트러블슈팅

개발 중 발생한 에러와 해결 방법을 기록합니다.

---

## 1. aioredis ImportError (Python 3.12+)

**에러**
```
ImportError: No module named 'distutils'
```

**원인**
`aioredis`는 Python 내장 모듈 `distutils`에 의존하는데, `distutils`가 Python 3.12부터 완전히 제거됐습니다.

**해결**
Redis 공식팀이 만든 `redis[asyncio]`로 교체합니다.

```toml
# pyproject.toml
# 변경 전
aioredis = "^2.0.1"
# 변경 후
redis = {extras = ["asyncio"], version = "^5.0.0"}
```

```python
# 변경 전
import aioredis
redis = await aioredis.from_url(...)
await redis.close()

# 변경 후
from redis.asyncio import Redis, from_url
redis = await from_url(...)
await redis.aclose()
```

---

## 2. next.config.ts 미지원 오류 (Next.js 14.2)

**에러**
```
Error: next.config.ts is not supported in Next.js 14.2.x
```

**원인**
Next.js 14.2.3은 TypeScript 설정 파일을 지원하지 않습니다.

**해결**
`next.config.ts` → `next.config.mjs` 로 이름을 바꾸고 타입 선언 방식을 변경합니다.

```javascript
// 변경 전 (next.config.ts)
import type { NextConfig } from "next";
const nextConfig: NextConfig = { ... };
export default nextConfig;

// 변경 후 (next.config.mjs)
/** @type {import('next').NextConfig} */
const nextConfig = { ... };
export default nextConfig;
```

---

## 3. poetry install 실패 — readme 경로 오류

**에러**
```
Readme path /...README.md does not exist
```

**원인**
`pyproject.toml`에 `readme = "README.md"`가 있는데 파일이 없을 경우 발생합니다.

**해결**
readme 항목을 제거하고 `package-mode = false`로 교체합니다.

```toml
# 변경 전
readme = "README.md"

# 변경 후
package-mode = false
```

---

## 4. uvicorn: command not found

**에러**
```
zsh: command not found: uvicorn
```

**원인**
Poetry 가상환경 밖에서 실행하면 uvicorn을 찾지 못합니다.

**해결**
`poetry run`을 앞에 붙여서 가상환경 안에서 실행합니다.

```bash
# 변경 전
uvicorn app.main:app --reload

# 변경 후
poetry run uvicorn app.main:app --reload
```

---

## 5. /issues 페이지 초기 렌더 401 오류

**증상**
로그인 후 `/issues`에 진입하면 "이슈를 불러오지 못했습니다." 에러가 표시됩니다.

**원인**
`useSession`은 초기에 `status: "loading"` 상태를 반환합니다. 이 상태에서 `accessToken`이 없는 채로 API 요청이 나가면 401이 발생하고 에러 상태로 굳어버립니다.

**해결**
`useEffect` 안에서 `status === "loading"` 일 때 요청을 보내지 않도록 가드를 추가합니다.

```typescript
// 변경 전
useEffect(() => {
  fetchIssues(session?.accessToken);
}, [session]);

// 변경 후
useEffect(() => {
  if (status === "loading") return;
  fetchIssues(session?.accessToken);
}, [session, status]);
```

---

## 6. WebSocket 연결되지만 메시지가 안 오는 문제

**증상**
WebSocket Status 101 연결은 성공하지만 브라우저 Network > Messages 탭이 비어있고 차트가 "데이터 수신 대기 중..."에서 멈춥니다.

**원인**
`_MOCK_DIR` 경로 계산이 잘못됐습니다. `Path(__file__).parents[4]`는 프로젝트 루트가 아니라 한 단계 위 디렉토리를 가리킵니다. mock 파일이 존재하지 않아 `path.exists()`가 False를 반환하고 아무 데이터도 전송되지 않습니다.

```
backend/app/api/websocket.py 기준:
parents[0] = backend/app/api/
parents[1] = backend/app/
parents[2] = backend/
parents[3] = wikipulse-service/  ← 프로젝트 루트
parents[4] = dev/                ← 잘못된 경로
```

**해결**
`parents[4]` → `parents[3]`으로 수정합니다. (`issues.py`도 동일하게 수정)

```python
# 변경 전
_MOCK_DIR = Path(__file__).parents[4] / "mock"
# 변경 후
_MOCK_DIR = Path(__file__).parents[3] / "mock"
```

---

## 7. npm install 경로 오류

**에러**
```
npm error Could not read package.json
```

**원인**
프로젝트 루트(`/wikipulse-service`)에서 실행하면 `package.json`을 찾지 못합니다. Next.js 프로젝트는 `frontend/` 안에 있습니다.

**해결**
`frontend/` 디렉토리 안에서 실행합니다.

```bash
cd frontend && npm install && npm run dev
```

---

## 8. WebSocket 잘못된 토큰 시 TestClient hang

**증상**
잘못된 토큰으로 WebSocket 연결 시 테스트가 타임아웃으로 멈춥니다.

**원인**
WebSocket 핸들러에서 `verify_jwt`가 `HTTPException`을 raise하면, FastAPI가 이를 HTTP 응답으로 처리하려다 WebSocket transport가 열린 채로 멈춥니다. WebSocket은 HTTP 예외가 아니라 WebSocket close frame으로 거부해야 합니다.

**해결**
`HTTPException`을 catch해서 `websocket.close(1008)`로 명시적으로 닫습니다.

```python
# 변경 전
@router.websocket("/ws/issues")
async def issue_stream(websocket: WebSocket, token: str = Query(...)):
    verify_jwt(token)  # HTTPException raise → hang
    await websocket.accept()

# 변경 후
@router.websocket("/ws/issues")
async def issue_stream(websocket: WebSocket, token: str = Query(...)):
    try:
        verify_jwt(token)
    except HTTPException:
        await websocket.close(code=1008)  # 1008: Policy Violation
        return
    await websocket.accept()
```
