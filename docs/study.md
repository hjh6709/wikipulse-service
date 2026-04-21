# WikiPulse 프로젝트 학습 노트

이 프로젝트를 하면서 알아야 하는 개념들을 정리한 문서입니다.

---

## 1. 전체 아키텍처 흐름

```
Wikipedia SSE → Kafka (데이터팀/AI팀)
                    ↓
              FastAPI (소비자)
              ↓ 읽기/쓰기    ↓ broadcast
            Redis          WebSocket
           (캐시)           ↓
                       Next.js (브라우저)
```

브라우저가 Next.js 화면을 보여주고, 데이터가 필요하면 FastAPI에 요청합니다.
FastAPI는 Redis에서 캐시된 데이터를 먼저 찾고, 없으면 Kafka에서 받은 데이터를 씁니다.

> 시각적인 시스템 구성도 → `docs/architecture.md` (Mermaid 다이어그램)

---

## 2. FastAPI

Python으로 만든 백엔드 서버입니다. 브라우저(또는 프론트엔드)의 요청을 받아서 데이터를 돌려줍니다.

### 기본 개념

**라우터(Router)** — URL 경로와 함수를 연결합니다.
```python
@router.get("/issues")       # GET /issues 요청이 오면
async def get_issues():      # 이 함수가 실행됩니다
    return [...]
```

**의존성 주입(Depends)** — 모든 엔드포인트에서 공통으로 실행할 코드를 분리합니다.
```python
# get_current_user가 먼저 실행되고, 통과하면 get_issues가 실행됩니다
async def get_issues(_: dict = Depends(get_current_user)):
```

**async/await** — 파이썬에서 비동기 처리를 하는 방식입니다. 응답을 기다리는 동안 다른 요청도 처리할 수 있어서 성능이 좋습니다.

### 이 프로젝트에서의 구조
```
backend/app/
├── main.py          # 서버 시작점, 라우터 등록
├── api/             # URL 경로 정의 (issues, alerts, websocket)
├── services/        # 외부 연동 (Redis, Kafka, Lambda)
├── schemas/         # 데이터 모양 정의 (Pydantic 모델)
└── core/            # 설정, 인증
```

---

## 3. Next.js 14

React 기반의 프론트엔드 프레임워크입니다.

### App Router

`app/` 폴더 구조가 곧 URL 경로가 됩니다.
```
app/page.tsx           → http://localhost:3000/
app/login/page.tsx     → http://localhost:3000/login
app/issues/page.tsx    → http://localhost:3000/issues
app/issues/[id]/page.tsx → http://localhost:3000/issues/issue-1
```

`[id]`처럼 대괄호로 감싸면 동적 경로입니다. `issue-1`, `issue-2` 등 어떤 값이든 받습니다.

### Server Component vs Client Component

**Server Component (기본값)** — 서버에서 실행. 브라우저에 JS 안 보냄. 빠름.
```typescript
// 파일 맨 위에 아무것도 없으면 Server Component
export default async function IssuesPage() {
  const data = await fetch(...)  // 서버에서 직접 fetch 가능
  return <div>{data}</div>
}
```

**Client Component** — 브라우저에서 실행. `useState`, `useEffect` 사용 가능.
```typescript
"use client"  // 파일 맨 위에 이걸 붙여야 Client Component

export default function IssueList() {
  const [issues, setIssues] = useState([])  // 브라우저에서 상태 관리
}
```

### 이 프로젝트에서 어떻게 쓰는지
- `app/issues/page.tsx` → Server Component (세션 확인, 로그인 안 됐으면 redirect)
- `components/IssueList.tsx` → Client Component (API 호출 후 목록 표시)

---

## 4. 인증 (Authentication)

### JWT (JSON Web Token)

로그인 후 서버가 발급하는 "통행증"입니다.
세 부분이 `.`으로 구분됩니다: `헤더.페이로드.서명`

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.abc123
      헤더                   페이로드          서명
```

- **페이로드**: 사용자 정보 (`{"sub": "dev", "name": "dev"}`)
- **서명**: 서버만 아는 비밀키로 서명 → 위조 불가

API 요청 시 헤더에 이렇게 붙입니다:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### 이 프로젝트의 흐름
```
1. 로그인 → next-auth가 JWT 생성 (비밀키: "wikipulse-dev-secret")
2. 프론트가 API 요청 시 JWT를 Authorization 헤더에 포함
3. FastAPI가 JWT 서명 검증 → 통과하면 데이터 반환
```

### next-auth

Next.js에서 인증을 쉽게 구현하는 라이브러리입니다.

**Provider** — 로그인 방식의 종류입니다.
- `CredentialsProvider` — 아이디/비밀번호 직접 입력 (현재 로컬 개발용)
- `KeycloakProvider` — Keycloak 서버에 위임 (추후 운영용)

**Session** — 로그인 상태를 유지하는 객체입니다. 브라우저 쿠키에 암호화되어 저장됩니다.
```typescript
const { data: session } = useSession()
session.user.name        // 로그인한 유저 이름
session.accessToken      // API 호출에 쓸 JWT
```

### Keycloak

회사/팀에서 운영하는 인증 서버입니다. 구글 로그인처럼 "Keycloak으로 로그인" 버튼을 누르면 Keycloak 서버로 이동해서 인증하고 돌아옵니다.

- **Realm**: Keycloak 안의 독립적인 인증 공간 (예: `wikipulse`)
- **Client**: Realm에 등록된 앱 (예: `wikipulse-frontend`)
- **OIDC (OpenID Connect)**: Keycloak이 사용하는 인증 프로토콜

로컬에 Keycloak 서버가 없으므로 → CredentialsProvider로 우회 중

---

## 5. Redis

메모리에 데이터를 저장하는 캐시 서버입니다. DB보다 100배 이상 빠릅니다.

### 왜 쓰나?

`GET /issues`를 매번 새로 계산하면 느리고 부하가 큽니다.
한번 계산한 결과를 Redis에 60초 동안 저장해두고 재사용합니다.

```
첫 요청 → Redis 없음 → 데이터 계산 → Redis에 저장 (TTL 60초)
이후 요청 → Redis에서 즉시 반환 (60초 동안)
60초 후 → Redis 만료 → 다시 계산
```

### TTL (Time To Live)

캐시 유효 시간입니다. `setex("issues:list", 60, data)` → 60초 후 자동 삭제.

### 이 프로젝트에서
- Redis 없어도 동작하도록 fallback 처리 (`try/except`)
- 로컬 개발 시 Redis 없어도 mock 데이터 반환

---

## 6. Kafka

팀 간에 데이터를 주고받는 메시지 큐입니다.

```
데이터팀 (생산자) → [Kafka 토픽] → 서비스팀 (소비자, 우리)
AI팀     (생산자) → [Kafka 토픽] → 서비스팀 (소비자, 우리)
```

### 토픽 (Topic)

메시지가 쌓이는 채널입니다. 우리가 읽는 토픽:
- `sentiment-results` — AI팀이 분석한 감성 결과
- `briefings` — AI팀이 만든 Gemini 브리핑
- `alerts` — 데이터팀이 감지한 편집 폭증 이벤트

### 현재 상태

Kafka 스키마가 아직 확정 안 됨 → `mock/` 폴더의 JSON 파일로 개발 중
실제 Kafka 연동은 김찬영(데이터팀), 양성호(AI팀)과 스키마 합의 후 진행

---

## 7. WebSocket

HTTP와 달리 연결을 계속 유지하는 통신 방식입니다.

```
HTTP: 요청 → 응답 → 연결 끊김 (매번 새로 연결)
WebSocket: 연결 → 계속 유지 → 서버가 언제든 데이터 push 가능
```

### 왜 쓰나?

실시간 데이터(편집 폭증 감지, 감성 분석 결과)를 브라우저가 계속 폴링하지 않아도 서버가 알아서 보내줄 수 있습니다.

### 이 프로젝트에서

```
Kafka 메시지 수신
    ↓
FastAPI WebSocket 서버가 연결된 브라우저 전체에 broadcast
    ↓
프론트 useWebSocket 훅이 수신 → 차트/피드 업데이트
```

메시지 타입으로 구분:
```json
{ "type": "sentiment", "data": {...} }
{ "type": "briefing",  "data": {...} }
{ "type": "spike",     "data": {...} }
```

---

## 8. Docker / Docker Compose

### Docker

앱을 컨테이너(격리된 환경)에 담아서 어디서든 똑같이 실행합니다.
"내 컴퓨터에서는 되는데..." 문제를 해결합니다.

### Docker Compose

여러 컨테이너를 한번에 실행합니다. `docker-compose.yml` 하나로:
```
docker compose up
→ FastAPI 컨테이너 시작
→ Next.js 컨테이너 시작
→ Redis 컨테이너 시작
```

### Dockerfile

컨테이너를 어떻게 만들지 정의한 파일입니다.
```dockerfile
FROM python:3.11-slim     # 베이스 이미지
WORKDIR /app              # 작업 폴더
COPY . .                  # 코드 복사
RUN poetry install        # 의존성 설치
CMD ["uvicorn", "app.main:app"]  # 실행 명령
```

---

## 9. Kong Gateway

API Gateway입니다. 브라우저와 FastAPI 사이에 위치합니다.

```
브라우저 → Kong → FastAPI
```

Kong이 하는 일:
- JWT 토큰 검증 (FastAPI 대신)
- 라우팅 (어떤 URL을 어느 서버로 보낼지)
- 인증 통합

로컬에는 Kong 없음 → FastAPI 직접 호출
운영에서는 `NEXT_PUBLIC_API_URL=http://kong:8000` 으로만 바꾸면 됨

---

## 10. 환경변수 (.env)

코드에 직접 넣으면 안 되는 값들(URL, 비밀키 등)을 파일로 분리합니다.

```env
REDIS_URL=redis://localhost:6379    # 로컬
REDIS_URL=redis://elasticache:6379  # 운영
```

파일 종류:
- `.env.local` — 로컬 개발용 (git에 올리지 않음)
- `.env.example` — 어떤 값이 필요한지 알려주는 템플릿 (git에 올림)

**`NEXT_PUBLIC_` 접두사** — 이게 붙은 변수만 브라우저에서 접근 가능합니다.
```env
NEXTAUTH_SECRET=...          # 서버에서만 사용 (브라우저에 노출 안 됨)
NEXT_PUBLIC_API_URL=...      # 브라우저에서도 사용
```

---

## 11. Poetry (Python 패키지 관리)

Python 의존성(라이브러리)을 관리합니다. Node.js의 npm과 비슷합니다.

```bash
poetry install          # pyproject.toml의 패키지 전부 설치
poetry add boto3        # 패키지 추가
poetry run uvicorn ...  # 가상환경 안에서 실행
```

`pyproject.toml` = `package.json` (패키지 목록)
`poetry.lock` = `package-lock.json` (정확한 버전 고정)

---

## 12. 감성 분석 (Sentiment Analysis)

AI팀(양성호)이 Reddit 댓글을 DistilBERT 모델로 분석합니다.

| 필드 | 설명 |
|---|---|
| `sentiment` | 분류 결과: `positive` / `negative` / `neutral` |
| `sentiment_score` | 해당 sentiment일 확신도 (0~1, 1에 가까울수록 확신) |

```json
{ "sentiment": "negative", "sentiment_score": 0.91 }
// → "이 댓글은 부정적이라고 91% 확신"
```

> `score`라고 쓰면 `spike_score`와 혼동되므로 반드시 `sentiment_score`로 구분

---

## 13. 이슈 생애주기

Wikipedia 편집 폭증 이벤트가 감지되면 이슈가 생성되고 상태가 변합니다.

```
발생 → 확산 → 정점 → 소강 → 아카이브
```

| 상태 | 홈 노출 | 상세 접근 |
|---|---|---|
| 발생 / 확산 / 정점 | ✅ | ✅ |
| 소강 | ❌ (자동 제거) | ✅ |
| 아카이브 | ❌ | ✅ (/history) |

상태 판단 주체는 아직 미확정 — 김찬영(데이터팀) 확인 필요 (`docs/decisions.md` 참고)

---

## 14. AWS Lambda

서버 없이 코드를 실행하는 AWS 서비스입니다. 항상 켜있지 않고 이벤트가 있을 때만 실행됩니다.

```
Kafka alerts 이벤트 수신
    ↓
FastAPI가 Lambda 호출 (boto3)
    ↓
Lambda 실행 → Discord/이메일 알림 발송
```

**왜 Lambda를 쓰나?**
알림 발송은 가끔 발생하는 작업이라 24시간 서버를 켜두는 것보다 이벤트 시에만 실행하는 게 비용 효율적입니다.

---

## 15. CloudFront (CDN)

AWS의 CDN(Content Delivery Network) 서비스입니다. 사용자 가까운 엣지 서버에서 콘텐츠를 제공해 속도를 높입니다.

```
사용자 (한국) → CloudFront 엣지 (서울) → K8s Next.js Pod
```

**CDN이란?**
전 세계 여러 곳에 캐시 서버를 두고, 사용자와 가장 가까운 서버에서 응답합니다. 원본 서버까지 매번 요청하지 않아도 됩니다.

> Cloudflare도 CDN 서비스지만 이 프로젝트는 AWS 스택 통일로 CloudFront 사용 (`docs/decisions.md` 참고)

---

## 16. structlog (JSON 로그)

FastAPI 기본 로그는 텍스트 형태라 FluentBit(로그 수집기)가 파싱하기 어렵습니다. structlog는 JSON 형태로 로그를 출력해서 Loki 같은 로그 수집 시스템과 연동할 수 있습니다.

```python
# 기존 텍스트 로그
INFO: GET /issues - 200

# structlog JSON 로그
{"event": "request", "method": "GET", "path": "/issues", "status": 200, "service": "wikipulse-api"}
```

> 조승연(SRE)의 FluentBit 파서 설정 확인 후 필드 구조 맞춰서 적용 (6주차)

---

## 17. Cursor 기반 페이지네이션

이슈 목록처럼 실시간으로 데이터가 추가되는 경우, 일반 page 방식 (`?page=1&page=2`)은 문제가 생깁니다.

```
# page 방식 문제점
1페이지 조회 (20개) → 새 이슈 1개 추가 → 2페이지 조회 시 이전 20번째 이슈가 다시 나옴 (중복)
```

cursor 방식은 "마지막으로 본 항목 다음부터" 가져옵니다.

```
GET /issues?cursor=issue-20&limit=20
→ issue-20 이후 20개 반환 → 중복/누락 없음
```

> 히스토리 페이지, 이슈 리스트 무한 스크롤 구현 시 사용 (7주차)

---

## 18. Jest (프론트엔드 테스트)

React 컴포넌트와 커스텀 훅을 테스트하는 JavaScript 테스트 프레임워크입니다. Python pytest의 프론트엔드 버전이라고 보면 됩니다.

```typescript
// IssueList 컴포넌트가 이슈 목록을 잘 렌더링하는지 검증
test("이슈 목록 렌더링", () => {
  render(<IssueList />)
  expect(screen.getByText("Mock Wikipedia Issue 1")).toBeInTheDocument()
})
```

> 8주차에 IssueList, useWebSocket 훅 테스트 작성 예정

---

## 19. k6 (부하 테스트)

API가 동시에 많은 요청을 받았을 때 얼마나 버티는지 측정하는 도구입니다.

```javascript
// 100명이 동시에 GET /issues를 30초간 요청
export const options = { vus: 100, duration: "30s" }
export default function () {
  http.get("http://localhost:8000/issues")
}
```

결과로 평균 응답시간, 에러율, 초당 처리량(RPS)을 확인합니다.

> 8주차 안정화 단계에서 사용

---

## 20. Dockerfile 멀티스테이지 빌드

이미지 크기를 줄이기 위해 빌드 단계와 실행 단계를 분리합니다.

```dockerfile
# 빌드 단계 — poetry, 개발 도구 포함 (무거움)
FROM python:3.11-slim AS builder
RUN pip install poetry
COPY pyproject.toml .
RUN poetry export -f requirements.txt > requirements.txt

# 실행 단계 — requirements.txt만 설치 (가벼움)
FROM python:3.11-slim
COPY --from=builder /app/requirements.txt .
RUN pip install -r requirements.txt
COPY app/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

poetry 자체가 이미지에 포함되지 않아서 최종 이미지가 훨씬 작아집니다.

> 7주차 배포 최적화 시 적용

---

## 21. 주차별 핵심 개념 요약

| 주차 | 핵심 개념 |
|---|---|
| 1주차 | FastAPI 구조, Next.js App Router, Docker Compose, Poetry |
| 2주차 | JWT 인증, next-auth, Redis 캐시, 환경변수, Kong Gateway |
| 3주차 | WebSocket, Kafka consume, Recharts 실시간 차트 |
| 4주차 | AWS Lambda, E2E 흐름, AI 브리핑 카드, pytest |
| 5주차 | 유저 API, 이슈 검색, status 필드, Kafka 에러 처리 |
| 6주차 | Keycloak SSO, Redis TTL 전략, structlog, 설정 페이지 API 연동 |
| 7주차 | CloudFront 배포, Lambda 알림, 히스토리 검색, cursor 페이지네이션, Dockerfile 최적화 |
| 8주차 | Jest 컴포넌트 테스트, k6 부하 테스트, Kafka 실데이터 연동, 팀 데모 |
