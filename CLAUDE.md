# WikiPulse — Service Team (Fullstack)

## Role
Solo fullstack: FastAPI backend + Next.js 14 frontend
Consume Kafka output from data/AI team → serve to browser

## Stack
- Backend: Python 3.11, FastAPI, aiokafka, redis[asyncio], python-jose, boto3, Poetry
- Frontend: Next.js 14 (App Router, TS), Tailwind, Recharts, next-auth
- Infra: Kong Gateway, ElastiCache Redis, AWS Lambda, CloudFront, Keycloak OIDC

## API
```
GET  /issues
GET  /issues/{id}/briefing
GET  /issues/{id}/sentiment
GET  /issues/{id}/timeline
POST /settings/alerts
WS   /ws/issues
```

## Kafka (consume only)
- `reddit-comments` → Reddit comment raw text (data team, 김찬영)
- `sentiment-results` → DistilBERT sentiment result per comment (AI team, 양성호)
- `briefings` → Gemini briefing (AI team, 양성호)
- `alerts` → spike event (data team, 김찬영)

## Now (Week 5)
- [ ] Kong Gateway integration (김용균 ArgoCD template)
- [ ] WebSocket auth method finalize (윤승호 confirm)
- [x] Kafka consume failure error handling (재시도 3회 + _kafka_healthy 플래그 + /health 노출)
- [x] GET /users/me, PATCH /users/me
- [x] Bookmark API (GET/POST/DELETE /users/bookmarks)
- [x] Preferences API (GET/POST /users/preferences)
- [x] Issue search (GET /issues?q=keyword)
- [x] Issue status field (발생/확산/정점/소강)
- [x] Archive issues API (GET /issues/archived)

## Done (Week 4)
- [x] Reddit comment feed (truncate + sort toggle)
- [x] Issue timeline component
- [x] AI briefing card
- [x] Landing page (unauthenticated preview, GET /issues?preview=true)
- [x] E2E pytest (12 tests: REST API + WebSocket)

## Notes
- Kafka schema TBD → use mock/ JSON
- No Kong/Keycloak locally → direct call + JWT mock
- aioredis replaced with redis[asyncio] (distutils removed in Python 3.12+)
- next.config.ts → next.config.mjs (not supported in Next.js 14.2)
- WS invalid token → close(1008) (not HTTPException raise)
- Sprint detail → docs/sprint.md
