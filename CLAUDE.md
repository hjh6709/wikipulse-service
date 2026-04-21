# WikiPulse — Service Team (Fullstack)

## Role
Solo fullstack: FastAPI backend + Next.js 14 frontend
Consume Kafka output from data/AI team → serve to browser

## Stack
- Backend: Python 3.11, FastAPI, aiokafka, redis[asyncio], python-jose, boto3, Poetry, structlog
- Frontend: Next.js 14 (App Router, TS), Tailwind, Recharts, next-auth
- Infra: Kong Gateway, ElastiCache Redis, AWS Lambda, CloudFront, Keycloak OIDC

## API
```
GET    /issues
GET    /issues/archived
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

## Kafka (consume only)
- `reddit-comments` → Reddit comment raw text (data team, 김찬영)
- `sentiment-results` → DistilBERT sentiment result per comment (AI team, 양성호)
- `briefings` → Gemini briefing (AI team, 양성호)
- `alerts` → spike event (data team, 김찬영) — status 필드 추가 요청 필요

## Pending (team dependencies)
- [ ] Keycloak SSO (next-auth KeycloakProvider, 윤승호 realm/client)
- [ ] Kong Gateway integration (김용균 ArgoCD template)
- [ ] WebSocket auth method finalize (윤승호 confirm)
- [ ] Lambda Discord/email alert (EventBridge, AWS)
- [ ] CloudFront deployment (김용균 confirm)
- [ ] k8s Deployment/Service yaml (인프라팀 template)
- [ ] alerts 토픽 status 필드 확인 (김찬영) → WebSocket 실시간 status 업데이트 구현
- [ ] Kafka real schema integration (mock → 실데이터, 김찬영·양성호 확정 후)

## Notes
- Kafka schema TBD → use mock/ JSON
- No Kong/Keycloak locally → direct call + JWT mock
- aioredis replaced with redis[asyncio] (distutils removed in Python 3.12+)
- next.config.ts → next.config.mjs (not supported in Next.js 14.2)
- WS invalid token → close(1008) (not HTTPException raise)
- alerts 토픽 status 필드 → 김찬영 확인 후 WebSocket spike 메시지에 status 포함 예정
- Sprint detail → docs/sprint.md
