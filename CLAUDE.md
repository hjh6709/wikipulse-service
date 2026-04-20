# WikiPulse — Service Team (Fullstack)

## Role
Solo fullstack: FastAPI backend + Next.js 14 frontend
Consume Kafka output from data/AI team → serve to browser

## Stack
- Backend: Python 3.11, FastAPI, aiokafka, aioredis, python-jose, Poetry
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

## Now (Week 1)
- [ ] FastAPI project init (Poetry)
- [ ] Next.js 14 project init (TS, App Router)
- [ ] Docker Compose local env (FastAPI + Next.js + Redis)
- [ ] Login page UI

## Notes
- Kafka schema TBD → use mock/ JSON
- No Kong/Keycloak locally → direct call + JWT mock
- Sprint detail → docs/sprint.md
