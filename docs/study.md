# WikiPulse — 구조를 이해하기 위한 개념 학습 노트

코드가 왜 그렇게 생겼는지 이해할 수 있도록, 데이터가 흐르는 순서대로 정리했습니다.

---

## 전체 데이터 흐름

```
Wikipedia 편집 감지 (데이터팀)
    ↓  Kafka 토픽에 메시지 발행
FastAPI (우리 백엔드)
    ├─ Redis에 캐시 저장 → GET /issues 응답에 사용
    └─ asyncio.Queue → WebSocket → 브라우저 실시간 push
Next.js (우리 프론트)
    ├─ REST 요청 → 이슈 목록, 상세, 브리핑, 감성 데이터
    └─ WebSocket 수신 → 차트/피드 실시간 업데이트
```

이 문서는 위 흐름을 따라 각 기술이 왜 필요하고 어떻게 동작하는지 설명합니다.

---

## 1. Kafka — 팀 간 데이터 파이프라인

### 왜 필요한가

데이터팀과 AI팀이 실시간으로 생산하는 데이터를 우리가 직접 받기 위한 채널입니다.
HTTP로 받으면 매번 폴링해야 하고, 팀 간 의존성이 강해집니다.
Kafka는 "메시지 우편함"처럼 동작합니다. 생산자가 넣어두면 소비자가 꺼냅니다.

```
데이터팀 (AIOKafkaProducer) → [alerts 토픽]          → 우리 (AIOKafkaConsumer)
AI팀     (AIOKafkaProducer) → [sentiment-results 토픽] → 우리
AI팀     (AIOKafkaProducer) → [briefings 토픽]         → 우리
데이터팀 (AIOKafkaProducer) → [reddit-comments 토픽]   → 우리
```

### 토픽과 메시지

**토픽(Topic)** — 메시지 종류별 채널. 우리가 소비(consume)하는 토픽:
- `alerts` — Wikipedia 편집 폭증 이벤트
- `sentiment-results` — Reddit 댓글 감성 분석 결과
- `briefings` — Gemini AI 브리핑 텍스트
- `reddit-comments` — Reddit 댓글 원문

**메시지** — JSON 직렬화된 딕셔너리. 예시:
```json
// alerts 토픽
{ "wiki_page": "ChatGPT", "edit_count": 142, "window": "5m", "status": "정점" }

// sentiment-results 토픽
{ "issue_id": "issue-1", "comment_id": "c1", "sentiment": "positive", "sentiment_score": 0.92 }
```

### 현재 코드

```python
# backend/app/services/kafka_consumer.py

_queue: asyncio.Queue[dict] = asyncio.Queue()  # Kafka 메시지를 담아두는 내부 큐

async def _consume(topics: list[str]) -> None:
    consumer = AIOKafkaConsumer(
        *topics,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id=settings.kafka_group_id,
        value_deserializer=lambda v: json.loads(v.decode()),  # bytes → dict
    )
    await consumer.start()
    async for msg in consumer:
        await _queue.put({"topic": msg.topic, "data": msg.value})
        if msg.topic == "alerts":
            await invalidate_issues_cache()  # 새 이벤트 → Redis 캐시 무효화
```

`asyncio.Queue`가 Kafka와 WebSocket 사이의 중간 다리 역할을 합니다.
Kafka 메시지가 들어오면 큐에 넣고, WebSocket 핸들러가 꺼내서 브라우저로 보냅니다.

### async/await 기초

FastAPI와 Kafka 코드 전체가 `async/await` 패턴을 씁니다.

```python
# 동기 — A가 끝날 때까지 B는 대기
result_a = slow_db_query()   # 100ms 기다림
result_b = slow_api_call()   # 또 100ms 기다림 → 총 200ms

# 비동기 — A 기다리는 동안 B 시작
result_a = await slow_db_query()   # 100ms 기다리는 동안
result_b = await slow_api_call()   #  동시에 진행 → 총 100ms
```

`async def`로 정의한 함수는 코루틴입니다. `await` 없이 호출하면 실행되지 않습니다.
FastAPI가 `async def` 엔드포인트를 자동으로 실행해줍니다.

---

## 2. FastAPI — 백엔드 API 서버

### 구조

```
backend/app/
├── main.py          # 서버 진입점: 미들웨어, 라우터 등록
├── api/
│   ├── issues.py    # GET /issues, GET /issues/{id}, ...
│   ├── users.py     # GET /users/me, PATCH /users/me, ...
│   ├── alerts.py    # POST /alerts/settings
│   └── websocket.py # WS /ws/issues
├── services/
│   ├── redis_client.py   # Redis 캐시 읽기/쓰기
│   ├── kafka_consumer.py # Kafka 소비, 큐 관리
│   └── lambda_trigger.py # AWS Lambda 호출
├── schemas/         # Pydantic 데이터 모델 (타입 검증)
└── core/
    ├── config.py    # 환경변수 설정
    ├── auth.py      # JWT 검증
    └── logging.py   # structlog JSON 로그
```

### 라우터와 엔드포인트

```python
# backend/app/api/issues.py

router = APIRouter(prefix="/issues", tags=["issues"])

@router.get("", response_model=list[Issue])  # GET /issues
async def get_issues(
    q: str | None = Query(None),         # ?q=검색어 (선택)
    cursor: str | None = Query(None),    # ?cursor=마지막ID (선택)
    limit: int = Query(5, ge=1, le=50),  # ?limit=5 (기본값 5, 1~50)
    _: dict | None = Depends(get_optional_user),  # 토큰 선택적 검증
):
    ...
```

`prefix="/issues"`를 붙이면 `@router.get("")`이 `GET /issues`가 됩니다.
`@router.get("/{issue_id}")`는 `GET /issues/issue-1`처럼 동적 경로를 받습니다.

### Pydantic — 타입 검증과 직렬화

FastAPI가 요청/응답 데이터의 타입을 자동 검증할 수 있게 해주는 라이브러리입니다.

```python
# backend/app/schemas/__init__.py (예시)

from pydantic import BaseModel

class Issue(BaseModel):
    issue_id: str
    title: str
    edit_count: int
    spike_score: float
    status: str
    updated_at: str
```

`response_model=list[Issue]`를 붙이면 FastAPI가 반환 데이터를 자동으로 이 모델에 맞춰 직렬화합니다.
타입이 맞지 않으면 422 에러를 반환합니다.

### 의존성 주입 (Depends)

공통 로직(인증 등)을 엔드포인트마다 반복 작성하지 않고 분리합니다.

```python
# 인증이 필요한 엔드포인트
@router.get("/archived", response_model=list[Issue])
async def get_archived_issues(_: dict = Depends(get_current_user)):
    # get_current_user가 먼저 실행 → 실패하면 401 반환 → 이 함수는 실행 안 됨
    ...

# 인증이 선택인 엔드포인트 (홈 미리보기 등)
@router.get("", response_model=list[Issue])
async def get_issues(_: dict | None = Depends(get_optional_user)):
    # 토큰 없어도 통과, 있으면 검증
    ...
```

### lifespan — 서버 시작/종료 시 실행할 코드

```python
# backend/app/main.py

@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_consumer()  # 서버 시작 시: Kafka consumer 실행
    yield                   # 서버 실행 중
    await close_redis()     # 서버 종료 시: Redis 연결 닫기
```

`yield` 이전은 시작 시, 이후는 종료 시 실행됩니다.

### CORS

브라우저는 다른 출처(origin)로의 요청을 기본적으로 막습니다.
`localhost:3000`(Next.js)이 `localhost:8000`(FastAPI)으로 요청하려면 허용해야 합니다.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 3. JWT — 인증 토큰

### JWT 구조

로그인 후 서버가 발급하는 "서명된 신분증"입니다. 세 부분이 `.`으로 구분됩니다.

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYiLCJuYW1lIjoiZGV2In0.abc123
        헤더                         페이로드                  서명
```

- **헤더**: 알고리즘 정보 (`{ "alg": "HS256" }`)
- **페이로드**: 사용자 정보 (`{ "sub": "dev", "name": "dev", "exp": 1234567890 }`)
- **서명**: `HMAC-SHA256(헤더.페이로드, 비밀키)` → 위조 불가

서버는 비밀키로 서명을 재계산해서 일치하면 유효한 토큰으로 인정합니다.

### 이 프로젝트의 인증 흐름

```
1. 로그인 → next-auth가 "wikipulse-dev-secret"으로 JWT 생성 (8시간 유효)
2. 프론트가 API 요청 시: Authorization: Bearer <JWT>
3. FastAPI가 같은 비밀키로 서명 검증 → 통과하면 payload 반환
```

```python
# backend/app/core/auth.py

_MOCK_SECRET = "wikipulse-dev-secret"
_ALGORITHM = "HS256"

def verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, _MOCK_SECRET, algorithms=[_ALGORITHM])
    except JWTError as e:
        raise HTTPException(status_code=401, detail=str(e))
```

WebSocket은 헤더를 붙일 수 없으므로 쿼리 파라미터로 전달합니다.
잘못된 토큰이면 `close(1008)` — HTTP처럼 예외를 올리면 안 됩니다 (연결이 맺어지기 전이라 close로 처리).

```python
# backend/app/api/websocket.py

@router.websocket("/ws/issues")
async def issue_stream(websocket: WebSocket, token: str = Query(...)):
    try:
        verify_jwt(token)
    except HTTPException:
        await websocket.close(code=1008)  # 1008 = Policy Violation
        return
    await websocket.accept()
```

### 토큰 만료

JWT에는 `exp` (expiration) 필드가 있습니다. 현재 8시간 TTL로 설정되어 있어서, 로그인 후 8시간이 지나면 WebSocket이 403으로 끊깁니다. 재로그인 필요.

---

## 4. Redis — 캐시 레이어

### 왜 캐시가 필요한가

`GET /issues` 요청이 올 때마다 Kafka에서 받은 데이터를 매번 계산하면:
- 동시 요청 100개 → 계산 100번 → 부하 급증
- 실제 데이터는 거의 바뀌지 않는데 낭비

Redis에 60초 저장하면:
```
첫 요청 → 계산 → Redis에 저장 (TTL 60초)
이후 59초간 → Redis에서 즉시 반환 (계산 없음)
60초 후 → 만료 → 다시 계산
```

### TTL과 캐시 무효화

```python
# backend/app/services/redis_client.py

async def set_issues_cached(data: list[dict], ttl: int = 60) -> None:
    redis = await get_redis()
    await redis.setex("issues:list", ttl, json.dumps(data))
    # setex = SET + EXpire: 60초 후 자동 삭제

async def invalidate_issues_cache() -> None:
    redis = await get_redis()
    await redis.delete("issues:list")
    # TTL을 기다리지 않고 즉시 삭제
```

`alerts` 토픽에 새 이벤트가 오면 → 캐시 즉시 무효화 → 다음 요청에 최신 데이터 반환.
60초 TTL만 있으면 새 이슈가 생겨도 최대 1분 지연이 생깁니다.

### Fallback 처리

Redis가 연결되지 않아도 서비스가 멈추면 안 됩니다.

```python
async def get_issues_cached() -> list[dict] | None:
    global _redis_healthy
    try:
        redis = await get_redis()
        cached = await redis.get("issues:list")
        _redis_healthy = True
        return json.loads(cached) if cached else None
    except Exception:
        _redis_healthy = False
        return None  # 캐시 없으면 None 반환 → 호출자가 계산해서 사용
```

`_redis_healthy` 플래그를 `/health` 엔드포인트에서 노출해서 프론트가 배너를 띄웁니다.

---

## 5. WebSocket — 실시간 Push

### HTTP vs WebSocket

```
HTTP: 요청 → 응답 → 연결 끊김 (새 데이터가 있어도 클라이언트가 먼저 요청해야 앎)
WebSocket: 연결 → 유지 → 서버가 언제든 먼저 보낼 수 있음
```

편집 폭증 알림, 감성 분석 결과, AI 브리핑이 생기는 시점을 서버만 알기 때문에
클라이언트가 폴링하지 않고 서버 push 방식이 필요합니다.

### 서버 코드 흐름

```python
# backend/app/api/websocket.py

_connected: set[WebSocket] = set()  # 현재 연결된 클라이언트들

@router.websocket("/ws/issues")
async def issue_stream(websocket: WebSocket, token: str = Query(...)):
    verify_jwt(token)           # 1. 토큰 검증
    await websocket.accept()    # 2. 연결 수락
    _connected.add(websocket)   # 3. 연결 목록에 추가

    try:
        queue = await get_message_queue()
        while True:
            msg = await queue.get()          # Kafka 큐에서 메시지 꺼냄
            await websocket.send_json(msg)   # 브라우저로 전송
    except WebSocketDisconnect:
        pass
    finally:
        _connected.discard(websocket)        # 연결 목록에서 제거
```

`asyncio.Queue`가 Kafka 소비자와 WebSocket 핸들러를 분리합니다.
- Kafka 소비자: `await _queue.put(msg)` — 큐에 넣기
- WebSocket 핸들러: `await queue.get()` — 큐에서 꺼내기

### Mock 스트림

로컬에서 Kafka 없이 테스트할 때는 `mock/` 폴더의 JSON 파일을 3초마다 보냅니다.

```python
async def _mock_stream(ws: WebSocket) -> None:
    files = ["sentiment-results.json", "briefings.json", "alerts.json", "comments.json"]
    while True:
        for fname in files:
            data = json.loads((MOCK_DIR / fname).read_text())
            await ws.send_json({"type": type_map[fname], "data": data})
            await asyncio.sleep(3)
```

---

## 6. Next.js 14 App Router — 프론트엔드

### App Router 구조

`app/` 폴더의 파일 경로가 곧 URL입니다.

```
app/page.tsx                → /
app/login/page.tsx          → /login
app/issues/page.tsx         → /issues
app/issues/[id]/page.tsx    → /issues/issue-1, /issues/archived-3 ...
app/history/page.tsx        → /history
app/settings/account/page.tsx → /settings/account
```

`[id]` — 대괄호는 동적 세그먼트. 어떤 값이든 `params.id`로 받습니다.

`layout.tsx` — 해당 경로와 모든 하위 경로에 공통으로 렌더됩니다.
`app/layout.tsx`는 모든 페이지에 `<Header>`를 붙이기 위해 씁니다.

### Server Component vs Client Component

**Server Component (기본값)** — 서버에서만 실행. JS 번들에 포함 안 됨. 빠름.
- `await fetch()`로 서버에서 직접 데이터 가져오기 가능
- `useState`, `useEffect` 사용 불가 (브라우저 API 없음)

**Client Component** — 브라우저에서 실행. 파일 맨 위에 `"use client"` 선언 필요.
- `useState`, `useEffect`, 브라우저 이벤트 사용 가능
- WebSocket 연결, 세션 읽기, 차트 렌더링에 사용

```typescript
// app/issues/page.tsx — Server Component
// 세션 확인 후 미로그인이면 /login으로 redirect
export default async function IssuesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <main><IssueList /></main>;
}
```

```typescript
// components/IssueList.tsx — Client Component
"use client";

export default function IssueList() {
  const [issues, setIssues] = useState<Issue[]>([]);
  useEffect(() => {
    fetchIssues(token).then(setIssues);
  }, []);
  ...
}
```

### TypeScript 핵심 개념

**타입 선언**
```typescript
type Issue = {
  issue_id: string;
  title: string;
  edit_count: number;
  status: "발생" | "확산" | "정점" | "소강";  // 유니언 타입: 이 4개 중 하나만 가능
  updated_at: string;
};
```

**제네릭(Generic)**
```typescript
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return res.json() as Promise<T>;
}

// 호출 시 T를 지정
const issues = await apiFetch<Issue[]>("/issues");  // T = Issue[]
const issue  = await apiFetch<Issue>("/issues/1");  // T = Issue
```

**Optional chaining (`?.`)**
```typescript
session?.user?.name  // session이 null이면 undefined 반환 (에러 없음)
```

---

## 7. next-auth — 프론트엔드 인증

### 왜 next-auth를 쓰는가

로그인 상태를 쿠키에 저장하고, 세션을 유지하고, 로그아웃하는 코드를 직접 짜면 보안 실수 가능성이 큽니다.
next-auth는 이걸 안전하게 처리해주는 라이브러리입니다.

### 설정 구조

```typescript
// frontend/lib/auth.ts

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // 로컬 개발용: 아무 username/password나 허용
      async authorize(credentials) {
        const token = sign({ sub: credentials.username }, "wikipulse-dev-secret", { expiresIn: "8h" });
        return { id: credentials.username, name: credentials.username, accessToken: token };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.accessToken = user.accessToken;  // accessToken을 JWT에 저장
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken;  // 세션에서 accessToken 접근 가능하게
      return session;
    }
  }
};
```

### 프론트에서 사용

```typescript
// 세션(로그인 상태)과 accessToken 읽기
const { data: session, status } = useSession();
const token = (session as { accessToken?: string })?.accessToken;

// status 상태
// "loading"       → 세션 로드 중 (아직 모름)
// "authenticated" → 로그인됨
// "unauthenticated" → 로그아웃 상태
```

로그인 시 발급된 JWT `accessToken`을 모든 API 요청의 `Authorization` 헤더에 붙입니다.

### API 요청 패턴

```typescript
// frontend/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}
```

---

## 8. useWebSocket — 커스텀 훅

### 커스텀 훅이란

`use`로 시작하는 함수로 로직을 재사용 가능하게 분리합니다.
컴포넌트에서 `useState`, `useEffect`를 쓰는 복잡한 로직을 한 곳에 모아둡니다.

### 코드 분석

```typescript
// frontend/hooks/useWebSocket.ts

export function useWebSocket(url: string) {
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);  // 렌더링과 무관하게 WS 객체 보관

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(url);
      ws.onopen  = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);  // 3초 후 자동 재연결
      };
      ws.onerror  = () => ws.close();
      ws.onmessage = (event) => {
        const msg: WSMessage = JSON.parse(event.data);
        setLastMessage(msg);  // 새 메시지마다 상태 업데이트
      };
    }
    connect();
    return () => wsRef.current?.close();  // 컴포넌트 언마운트 시 연결 해제
  }, [url]);  // url이 바뀔 때만 재실행

  return { lastMessage, connected };
}
```

### 이슈 상세 페이지에서의 사용

```typescript
// frontend/app/issues/[id]/page.tsx

const { lastMessage, connected } = useWebSocket(wsUrl ?? "");

useEffect(() => {
  if (!lastMessage) return;
  if (lastMessage.type === "briefing") setBriefing(lastMessage.data);
  if (lastMessage.type === "spike")    setSpikeData(lastMessage.data);
  if (lastMessage.type === "comment")  setCommentData(lastMessage.data);
}, [lastMessage]);  // 새 메시지가 올 때마다 실행
```

`lastMessage`가 바뀔 때마다 `useEffect`가 실행되고, 타입에 따라 각 상태를 업데이트합니다.
차트와 피드 컴포넌트가 이 상태를 props로 받아 리렌더됩니다.

---

## 9. Tailwind CSS — 스타일링

### 클래스 기반 스타일

CSS 파일을 따로 쓰지 않고 HTML에 유틸리티 클래스를 직접 붙입니다.

```tsx
<div className="bg-stone-900 border border-stone-800 rounded-xl p-4 hover:bg-stone-800 transition-colors">
```

| 클래스 | 의미 |
|---|---|
| `bg-stone-900` | 배경색 (stone 팔레트 900단계) |
| `border border-stone-800` | 테두리 |
| `rounded-xl` | 모서리 둥글게 |
| `p-4` | padding 4단계 (1rem) |
| `hover:bg-stone-800` | hover 시 배경색 변경 |
| `transition-colors` | 색상 변화에 애니메이션 |

### 이 프로젝트의 디자인 시스템

```
배경: navy (#0B0E14, bg-navy) → surface (#161B22, bg-surface)
텍스트: white → slate-300 → slate-400 → slate-500
액센트(강조): blue-500 (#3B82F6) — 버튼, 활성 필터, 글로우 효과
상태 색상:
  발생: sky-400   (#38BDF8) + neon dot glow
  확산: blue-500  (#3B82F6) + neon dot glow
  정점: orange-400 (#FB923C) + neon dot glow
  소강: slate-500 (#64748B)
```

**커스텀 색상**: `tailwind.config.ts`에 `navy`, `surface` 추가 — `bg-navy`, `bg-surface`로 사용

**카드 스타일**: `bg-surface ring-1 ring-blue-500/10 shadow-blue-glow` — 테두리 대신 ring + glow shadow

**투명도 접미사**: `bg-blue-500/15` → blue-500 색상의 15% 불투명도 배경

**좌측 보더**: `border-l-2 border-l-blue-500/30` → 상태별 2px 왼쪽 테두리

### font-display (Playfair Display)

```typescript
// frontend/tailwind.config.ts
fontFamily: {
  display: ["var(--font-display)", "Georgia", "serif"],
}

// 사용
<h1 className="font-display text-3xl">WikiPulse</h1>
```

`next/font/google`으로 로드한 Playfair Display 서체를 CSS 변수로 주입합니다.
로고, 페이지 h1 제목에만 사용해서 serif 분위기를 만듭니다.

---

## 10. Recharts — 차트

React 기반 차트 라이브러리입니다. 데이터 배열을 props로 넘기면 SVG 차트를 렌더합니다.

```tsx
// SpikeChart 예시 구조

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={spikePoints}>   {/* [{ time: "14:00", edit_count: 20 }, ...] */}
    <defs>
      <linearGradient id="spikeGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
      </linearGradient>
    </defs>
    <XAxis dataKey="time" />
    <YAxis />
    <Area type="monotone" dataKey="edit_count" stroke="#3B82F6" fill="url(#spikeGradient)" />
  </AreaChart>
</ResponsiveContainer>
```

`ResponsiveContainer` — 부모 크기에 맞게 자동 조정
`dataKey` — 데이터 객체의 어떤 필드를 X/Y축으로 쓸지 지정

---

## 11. Docker & Docker Compose

### Docker

앱과 실행 환경을 통째로 묶은 "이미지"를 만들고, 어디서든 똑같이 실행합니다.

```dockerfile
# backend/Dockerfile (멀티스테이지)

FROM python:3.11-slim AS builder   # 1단계: 빌드 환경 (poetry 포함, 무거움)
RUN pip install poetry
COPY pyproject.toml poetry.lock .
RUN poetry export -f requirements.txt > requirements.txt

FROM python:3.11-slim              # 2단계: 실행 환경 (poetry 제외, 가벼움)
COPY --from=builder /app/requirements.txt .
RUN pip install -r requirements.txt
COPY app/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

멀티스테이지 빌드: 빌드 도구(poetry)를 최종 이미지에서 제외해서 이미지 크기를 줄입니다.

### Docker Compose

여러 컨테이너를 한 명령으로 실행합니다.

```yaml
# docker-compose.yml (개념)

services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      REDIS_URL: redis://redis:6379   # 컨테이너 이름으로 접근
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  redis:
    image: redis:7-alpine
```

`docker compose up --build` 하나로 전부 실행됩니다.

---

## 12. 환경변수

### .env 파일 분리

```
backend/.env.local      → 로컬용 (git 제외)
backend/.env.example    → 어떤 변수가 필요한지 문서화 (git 포함)
```

코드에 URL, 비밀키, 포트를 직접 쓰면 환경마다 코드를 바꿔야 하고, 비밀키가 노출됩니다.

### NEXT_PUBLIC_ 접두사

```env
NEXTAUTH_SECRET=abc123              # 서버(Node.js)에서만 접근 가능
NEXT_PUBLIC_API_URL=http://...      # 브라우저 JS에도 포함됨 (노출됨)
NEXT_PUBLIC_WS_URL=ws://...
```

브라우저에서 접근해야 하는 변수만 `NEXT_PUBLIC_`을 붙입니다.
API 비밀키 같은 건 절대 `NEXT_PUBLIC_`을 붙이면 안 됩니다.

### Mock 모드

```env
USE_MOCK=true   # Kafka, Keycloak 없이 로컬 개발
```

```python
# backend/app/core/config.py

class Settings(BaseSettings):
    use_mock: bool = True
    redis_url: str = "redis://localhost:6379"
    kafka_bootstrap_servers: str = "localhost:9092"

settings = Settings()
```

`settings.use_mock`이 True면 Kafka consumer를 건너뛰고 mock JSON 파일을 사용합니다.

---

## 13. 커서 기반 페이지네이션

### page 방식의 문제

```
1페이지 조회 (5개: issue-1~5) → 새 이슈 issue-6 추가 →
2페이지 조회 → issue-5가 또 나옴 (중복)
```

### cursor 방식

"마지막으로 본 항목 이후부터" 가져옵니다.

```
GET /issues            → [issue-6, issue-5, issue-4, issue-3, issue-2] (5개)
GET /issues?cursor=issue-2 → [issue-1] (issue-2 이후)
```

```python
# backend/app/api/issues.py

if cursor:
    ids = [d["issue_id"] for d in data]
    start = ids.index(cursor) + 1 if cursor in ids else 0
    data = data[start:]
return data[:limit]
```

프론트는 마지막 항목의 `issue_id`를 cursor로 저장하고, "더 보기" 클릭 시 전달합니다.

---

## 14. 운영 인프라 (개념)

### Kong Gateway

브라우저와 FastAPI 사이에 위치하는 API 게이트웨이입니다.

```
브라우저 → Kong (8000) → FastAPI (8080)
```

Kong이 하는 일: JWT 검증, 라우팅, 인증 통합, Rate Limiting.
FastAPI에서 직접 JWT를 검증하는 코드 (`core/auth.py`)는 Kong 연동 후 제거 예정입니다.

### Keycloak SSO

팀에서 운영하는 인증 서버입니다. "Keycloak으로 로그인" 버튼을 누르면:

```
브라우저 → Keycloak 로그인 화면 → 인증 성공 → 코드 발급 →
Next.js가 코드를 JWT로 교환 → 세션 저장
```

현재는 `CredentialsProvider` (mock 로그인)를 쓰고, 운영 시 `KeycloakProvider`로 교체합니다.

### AWS Lambda + EventBridge

알림 발송처럼 가끔 실행되는 작업에 씁니다. 항상 켜있는 서버보다 비용 효율적입니다.

```
Kafka alerts 수신 → FastAPI가 boto3로 Lambda 호출 → Lambda가 Discord/이메일 발송
```

### CloudFront (CDN)

사용자 가까운 엣지 서버에서 응답해서 속도를 높입니다.

```
한국 사용자 → CloudFront 서울 엣지 → (없으면) K8s Next.js Pod
```

---

## 15. 개발 도구

### Poetry (Python 패키지 관리)

```bash
poetry install          # pyproject.toml 기준으로 전체 설치
poetry add boto3        # 패키지 추가
poetry run uvicorn ...  # 가상환경 안에서 실행
```

`pyproject.toml` ≒ `package.json`, `poetry.lock` ≒ `package-lock.json`

### structlog (JSON 로그)

```python
# 일반 로그 (FluentBit 파싱 어려움)
INFO:     GET /issues - 200

# structlog JSON 로그 (Loki 수집 용이)
{"event": "request", "method": "GET", "path": "/issues", "status": 200}
```

### 테스트 전략

| 도구 | 대상 | 시점 |
|---|---|---|
| pytest | FastAPI 엔드포인트, WebSocket | 4주차 22개 완료, 실데이터 연동 후 추가 |
| Jest | React 컴포넌트, useWebSocket 훅 | 8주차 예정 |
| k6 | API 부하 테스트 (동시 100명) | 8주차 예정 |

---

## 흐름 요약

```
1. [사용자] localhost:3000 접속
2. [Next.js] 미로그인 → /login redirect
3. [사용자] 로그인
4. [next-auth] JWT 생성 (8h TTL), 세션에 accessToken 저장
5. [Next.js] /issues 페이지 로드, IssueList 컴포넌트 마운트
6. [IssueList] fetchIssues(token) → GET /issues (Authorization: Bearer <JWT>)
7. [FastAPI] JWT 검증 → Redis 캐시 확인
   - 캐시 있음 → 즉시 반환
   - 캐시 없음 → mock 데이터 생성 → Redis에 저장 → 반환
8. [IssueList] 이슈 목록 렌더링
9. [사용자] 이슈 클릭 → /issues/issue-1
10. [IssuePage] WebSocket 연결: ws://localhost:8000/ws/issues?token=<JWT>
11. [FastAPI] JWT 검증 → accept() → _connected에 추가
12. [WebSocket] mock 스트림 시작 (3초마다 sentiment/briefing/spike/comment 전송)
13. [IssuePage] lastMessage 수신 → 타입별 상태 업데이트 → 차트/피드 리렌더
```
