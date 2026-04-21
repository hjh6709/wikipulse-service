# WikiPulse — Real-time Issue Detection Platform

뉴스 기사가 나오기 전에 이슈를 포착합니다.

Wikipedia 편집이 폭증하는 순간, 해당 키워드로 Reddit 여론을 자동 수집하고 AI가 "지금 무슨 일이 벌어지고 있는가"를 한 문장으로 요약합니다.

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
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts |
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
GET  /issues
GET  /issues/{id}/briefing
GET  /issues/{id}/sentiment
GET  /issues/{id}/timeline
POST /alerts/settings
WS   /ws/issues
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

## Features

- **Mock Mode** — `USE_MOCK=true` 설정으로 Kafka/Keycloak 없이 전체 기능 로컬 테스트 가능
- **Redis Cache** — 이슈 목록 60초 캐시, Redis 미연결 시 자동 fallback
- **JWT Auth** — next-auth 기반 인증, 미로그인 시 `/login` 자동 redirect
- **WebSocket** — 실시간 감성 분석/브리핑/스파이크/댓글 이벤트 스트리밍
- **Landing Page** — 비로그인 트렌딩 이슈 미리보기 3개 (`GET /issues?preview=true`)
- **Reddit Comment Feed** — 실시간 댓글 피드, 최신순/인기순 정렬, 3줄 truncate + 더보기
- **Issue Timeline** — 이슈 생애주기 타임라인 (REST API 초기 로드)

## Roadmap

- [x] Week 1 — FastAPI + Next.js 14 프로젝트 scaffold, Docker Compose, Swagger UI (`/docs`)
- [x] Week 2 — 로그인 플로우, 이슈 리스트, Redis 캐시, 세션 토큰 연동
- [x] Week 3 — WebSocket 서버, Kafka consume, 실시간 차트 (Recharts)
- [x] Week 4 — AI 브리핑 카드, Reddit 댓글 피드, 이슈 타임라인, 랜딩 페이지, E2E pytest (12개)
- [ ] Week 5 — Kong Gateway 연동, 유저 API, 북마크, 이슈 검색
