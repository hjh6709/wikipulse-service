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
POST /alerts/settings
WS   /ws/issues
```

## Kafka (consume only)
- `sentiment-results` → sentiment data (AI team)
- `briefings` → Gemini briefing (AI team)
- `alerts` → spike event (data team)

## Now (Week 3)
- [ ] WS /ws/issues WebSocket server
- [ ] Kafka sentiment-results consume → WebSocket broadcast
- [ ] useWebSocket custom hook
- [ ] Edit spike chart (Recharts)
- [ ] Sentiment distribution chart (real-time)
- [ ] E2E test with mock data

## Done (Week 2)
- [x] Mock Credentials provider for local login
- [x] GET /issues Redis cache + fallback
- [x] Session token → API call integration
- [x] Trending issue list page
- [x] Redirect to /login if unauthenticated

## Done (Week 1)
- [x] FastAPI project init (Poetry)
- [x] Next.js 14 project init (TS, App Router)
- [x] Docker Compose local env (FastAPI + Next.js + Redis)
- [x] OpenAPI schema draft (/docs Swagger)
- [x] Keycloak OIDC next-auth config (local server deferred to Week 2)
- [x] Login page UI wireframe

## Notes
- Kafka schema TBD → use mock/ JSON
- No Kong/Keycloak locally → direct call + JWT mock
- aioredis replaced with redis[asyncio] (distutils removed in Python 3.12+)
- next.config.ts → next.config.mjs (not supported in Next.js 14.2)
- Sprint detail → docs/sprint.md
