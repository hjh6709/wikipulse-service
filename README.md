# WikiPulse — Real-time Wikipedia Edit Spike Dashboard

Wikipedia 편집 폭증 이벤트를 실시간으로 감지하고 대시보드로 시각화하는 모니터링 시스템입니다.

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
- **WebSocket** — 실시간 감성 분석/브리핑/스파이크 이벤트 스트리밍 (Week 3)

## Roadmap

- [x] Week 1 — FastAPI + Next.js 14 프로젝트 scaffold, Docker Compose, OpenAPI 스키마
- [x] Week 2 — 로그인 플로우, 이슈 리스트, Redis 캐시, 세션 토큰 연동
- [ ] Week 3 — WebSocket 서버, Kafka consume, 실시간 차트 (Recharts)
- [ ] Week 4 — AI 브리핑 카드, 알림 설정, Lambda 연동, E2E 테스트
