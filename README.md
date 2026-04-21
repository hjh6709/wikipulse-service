# WikiPulse — Real-time Issue Detection Platform

지금 Wikipedia에서 무슨 일이 벌어지고 있나요?

Wikipedia 편집이 폭증하는 순간, 해당 키워드로 Reddit 여론을 자동 수집하고 AI가 맥락을 실시간으로 브리핑합니다.

## Why WikiPulse?

| | 기존 뉴스/트렌드 서비스 | WikiPulse |
|---|---|---|
| 이슈 감지 시점 | 기사 보도 후 | 편집 폭증 감지 즉시 |
| 여론 데이터 | 없음 | Reddit 감성 분석 자동 수집 |
| 해석 | 기자가 작성 | AI가 실시간 브리핑 생성 |
| 대상 | 일반 독자 | 언론사, 홍보, 리서치 애널리스트 |

## Tech Stack

| 분류 | 기술 |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Playfair Display |
| Backend | FastAPI, Python 3.11, Poetry, Pydantic v2 |
| Auth | next-auth, Keycloak OIDC |
| Real-time | WebSocket, Kafka (aiokafka) |
| Cache | Redis (redis[asyncio]) |
| Infra | Docker, Docker Compose, Kong Gateway, AWS Lambda |

## Architecture

```
Browser (Next.js)
    ↓ HTTP / WebSocket
FastAPI
    ↓ cache          ↓ consume
  Redis            Kafka
                (AI/Data team)
```

## API

```
GET    /issues
GET    /issues/archived
GET    /issues/{id}
GET    /issues/{id}/briefing
GET    /issues/{id}/sentiment
GET    /issues/{id}/timeline
POST   /alerts/settings
GET    /users/me
PATCH  /users/me
GET    /users/bookmarks
POST   /users/bookmarks
DELETE /users/bookmarks/{id}
GET    /users/preferences
POST   /users/preferences
WS     /ws/issues
```

## Getting Started

### 환경변수 설정

```bash
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

### Docker로 실행 (권장)

```bash
docker compose up --build
```

### 로컬 직접 실행

**Backend**
```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
# http://localhost:8000/health
# http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

로그인 화면에서 아무 username/password 입력하면 로컬 mock 로그인이 됩니다.  
토큰 만료(8시간)되면 재로그인 필요.

## Features

- **Trend** — 실시간 이슈 피드, 상태별 좌측 컬러 보더, 상대 시간, 상태 필터, 커서 페이지네이션
- **Archive** — 소강 완료 이슈 아카이브, 월별 그룹핑, 기간 필터(3개월/6개월/1년), 최신순/편집 많은순 정렬
- **Issue Detail** — AI 브리핑, 편집 스파이크 차트, 감성 분포, 타임라인, Reddit 댓글 피드 (WebSocket 실시간)
- **Mock Mode** — `USE_MOCK=true` 설정으로 Kafka/Keycloak 없이 전체 기능 로컬 테스트 가능
- **Redis Cache** — 이슈 목록 60초 캐시, Redis 미연결 시 자동 fallback
- **JWT Auth** — next-auth 기반 인증, 미로그인 시 `/login` 자동 redirect
- **WebSocket** — 실시간 감성 분석/브리핑/스파이크/댓글 이벤트 스트리밍
- **System Banner** — Kafka/Redis 장애 시 UI 경고 배너 자동 표시

## Roadmap

- [x] Week 1 — FastAPI + Next.js 14 프로젝트 scaffold, Docker Compose, Swagger UI (`/docs`)
- [x] Week 2 — 로그인 플로우, 이슈 리스트, Redis 캐시, 세션 토큰 연동
- [x] Week 3 — WebSocket 서버, Kafka consume, 실시간 차트 (Recharts)
- [x] Week 4 — AI 브리핑 카드, Reddit 댓글 피드, 이슈 타임라인, 랜딩 페이지, E2E pytest
- [x] Week 5 — 유저 API, 북마크, 관심 카테고리, 이슈 검색, 아카이브 API
- [x] Week 6 — 온보딩, 알림 설정, 네비게이션, Redis TTL 전략, JSON 로그
- [x] Week 7 — Archive 페이지, 커서 페이지네이션, 404, 스켈레톤 UI, 멀티스테이지 Dockerfile
- [x] Week 8 — 전체 UI 폴리싱 (stone 테마, amber 액센트, serif 폰트, Archive/Trend 개편, 접근성 개선)
- [ ] Real data — Kafka 실제 스키마 연동 (김찬영·양성호 확정 후)
- [ ] Infra — Kong Gateway, Keycloak SSO, CloudFront, k8s yaml
