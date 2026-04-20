# WikiPulse 서비스팀 — Month 1 스프린트 상세

## 담당 범위

### 백엔드 (FastAPI)
- 이슈 피드, 브리핑, 감성 결과, 타임라인, 알림 설정 REST API
- WebSocket 실시간 이슈 스트림 (`/ws/issues`)
- Kong Gateway 연동 (라우팅, JWT 검증)
- ElastiCache Redis 연동 (이슈 캐싱)
- AWS Lambda + EventBridge (Discord/이메일 알림)
- Keycloak OIDC 연동

### 프론트엔드 (Next.js 14)
- 로그인 UI (Keycloak OIDC)
- 트렌딩 이슈 리스트
- 편집 스파이크 그래프 (WebSocket 실시간)
- Reddit 댓글 피드 (WebSocket 실시간)
- 감성 분포 차트 (WebSocket 실시간)
- AI 브리핑 카드 (WebSocket 실시간)
- 이슈 타임라인, 토픽 클러스터 시각화, 히스토리 검색
- CloudFront CDN 배포

---

## 디렉토리 구조

```
wikipulse-service/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── issues.py
│   │   │   ├── alerts.py
│   │   │   └── websocket.py
│   │   ├── services/
│   │   │   ├── kafka_consumer.py
│   │   │   ├── redis_client.py
│   │   │   └── lambda_trigger.py
│   │   ├── schemas/
│   │   └── core/
│   │       ├── config.py
│   │       └── auth.py
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── login/
│   │   └── issues/[id]/
│   ├── components/
│   │   ├── IssueList.tsx
│   │   ├── SpikeChart.tsx
│   │   ├── SentimentChart.tsx
│   │   ├── BriefingCard.tsx
│   │   ├── CommentFeed.tsx
│   │   └── IssueTimeline.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts
│   ├── lib/
│   │   └── api.ts
│   └── Dockerfile
├── mock/                        # 로컬 개발용 mock 데이터 (백엔드/프론트 공용)
│   ├── sentiment-results.json
│   ├── briefings.json
│   └── alerts.json
├── k8s/                         # K8s 배포 yaml (인프라팀 템플릿 받은 후 추가)
├── docs/
│   ├── sprint.md
│   ├── api-schema.md            # 팀 간 합의한 Kafka/API 스키마 기록용
│   └── decisions.md             # 아키텍처 결정 기록용
├── docker-compose.yml
└── CLAUDE.md
```

---

## 주별 목표

### 1주차 — 환경 세팅 & 뼈대
- [ ] FastAPI 프로젝트 생성 (Poetry)
- [ ] Next.js 14 프로젝트 생성 (TypeScript, App Router)
- [ ] Docker Compose 로컬 개발환경 (FastAPI + Next.js + Redis + Kafka)
- [ ] OpenAPI 스키마 초안 (데이터팀과 인터페이스 합의용)
- [ ] Keycloak OIDC 기본 연동 설정
- [ ] 로그인 페이지 UI 와이어프레임

✅ **완료 기준**: `/health` 응답 + Next.js 로컬 실행 + 로그인 화면 렌더링

---

### 2주차 — 로그인 + 이슈 피드 REST API
- [ ] Keycloak OIDC 로그인 완성 (next-auth)
- [ ] `GET /issues` 구현 (Redis 캐시 우선)
- [ ] `GET /issues/{id}/sentiment` 구현
- [ ] Kong Gateway 라우팅 설정
- [ ] 트렌딩 이슈 리스트 컴포넌트

✅ **완료 기준**: 로그인 → 이슈 리스트 화면 진입 가능

---

### 3주차 — WebSocket + 실시간 차트
- [ ] `WS /ws/issues` WebSocket 서버 구현
- [ ] Kafka `sentiment-results` consume → WebSocket broadcast
- [ ] `useWebSocket` 커스텀 훅 구현
- [ ] 편집 스파이크 그래프 (Recharts)
- [ ] 감성 분포 차트 (실시간)
- [ ] mock 데이터로 E2E 테스트

✅ **완료 기준**: mock 데이터로 스파이크 그래프·감성 차트 실시간 업데이트 확인

---

### 4주차 — Reddit 피드 + 타임라인 + Month 1 마일스톤
- [ ] Kafka `briefings` consume → WebSocket broadcast
- [ ] `GET /issues/{id}/briefing` 구현
- [ ] `POST /alerts/settings` + Lambda 트리거 연동
- [ ] Reddit 댓글 피드 컴포넌트
- [ ] 이슈 타임라인 컴포넌트
- [ ] AI 브리핑 카드 프로토타입
- [ ] E2E 시나리오 테스트 + 팀 데모

✅ **Month 1 마일스톤**: 편집 폭증 이벤트 → 대시보드 실시간 반영 E2E 흐름 동작

---

## 구현 현황 & 추후 결정 사항

---

### 1. Kafka 스키마
- **현재 구현**: `mock/` 폴더 임시 JSON으로 개발
```json
// mock/sentiment-results.json
{
  "issue_id": "string",
  "comment_id": "string",
  "sentiment": "positive|negative|neutral",
  "score": 0.92,
  "timestamp": "2026-04-20T00:00:00Z"
}
// mock/briefings.json
{
  "issue_id": "string",
  "summary": "string",
  "key_points": ["string"],
  "created_at": "2026-04-20T00:00:00Z"
}
```
- **추후 결정 필요**: 김찬영(데이터팀), 양성호(AI팀)과 실제 스키마 합의 후 교체
- **필요한 이유**: 스키마가 다르면 FastAPI consume 코드와 프론트 렌더링 코드를 전부 다시 짜야 함. 1주차에 합의 못 하면 mock 기반 개발이 낭비될 수 있음
- **확인 대상**: 김찬영(sentiment-results, alerts 토픽), 양성호(briefings 토픽)

---

### 2. K8s 배포 연동
- **현재 구현**: Docker Compose 로컬 개발환경만 구성, `k8s/` 폴더 비어있음
- **추후 결정 필요**: 김용균(인프라팀)에게 ArgoCD 템플릿 받아서 `k8s/` 폴더에 추가
- **필요한 이유**: ArgoCD가 바라보는 레포/브랜치/경로가 정해져 있어서, 그 구조에 안 맞으면 자동 배포가 안 됨. Deployment·Service yaml 포맷도 팀 컨벤션 따라야 함
- **확인 대상**: 김용균 — ArgoCD 레포 구조, Deployment/Service yaml 템플릿 요청

---

### 3. WebSocket 인증
- **현재 구현**: FastAPI에서 쿼리파라미터로 JWT 받아서 직접 검증
```python
# backend/app/api/websocket.py
@app.websocket("/ws/issues")
async def issue_stream(websocket: WebSocket, token: str = Query(...)):
    payload = verify_jwt(token)  # FastAPI에서 직접 검증
    await websocket.accept()
    ...
```
```typescript
// frontend/hooks/useWebSocket.ts
const ws = new WebSocket(`ws://host/ws/issues?token=${jwtToken}`);
```
- **추후 결정 필요**: Kong이 WebSocket upgrade 요청의 JWT 검증을 지원하는지 확인 후 교체 가능
- **필요한 이유**: Kong에서 처리하면 FastAPI 검증 코드 제거 가능하고 보안 정책이 한 곳에서 관리됨. 하지만 Kong WebSocket 플러그인 설정이 필요해서 윤승호 확인 없이는 진행 불가
- **확인 대상**: 윤승호 — Kong WebSocket upgrade 요청 JWT 검증 플러그인 지원 여부

---

### 4. 에러 처리 / 로딩 상태
- **현재 구현**: WebSocket 자동 재연결 + 로딩 스피너만 구현 (Month 1 데모 최소 대응)
```typescript
// frontend/hooks/useWebSocket.ts
function useWebSocket(url: string) {
  const reconnect = () => setTimeout(() => connect(), 3000); // 3초 후 재연결
  ws.onclose = reconnect;
}
```
```python
# backend/app/services/kafka_consumer.py
for attempt in range(3):  # 재시도 3회
    try:
        await consumer.start()
        break
    except Exception:
        await asyncio.sleep(2)
```
- **추후 결정 필요**: Month 2에서 케이스별 에러 처리 고도화
- **필요한 이유**: 데모에서는 최소 대응으로 충분하지만, 운영 환경에서 Kafka/Redis 장애 시 사용자에게 적절한 피드백이 없으면 서비스가 그냥 멈춰 보임

| 상황 | 추후 백엔드 | 추후 프론트 |
|---|---|---|
| Kafka consume 실패 | 재시도 3회 후 알림 로그 | "데이터 로딩 중" 배너 |
| Redis 장애 | DB 직접 조회 fallback | 그대로 표시 |
| WebSocket 끊김 | - | 3초 후 자동 재연결 (이미 구현) |

---

### 5. 테스트 전략
- **현재 구현**: 테스트 없이 로컬 실행으로만 검증
- **추후 결정 필요**: Month 2에서 테스트 코드 추가
- **필요한 이유**: CI에서 CodeQL + Ruff가 돌아가는데, 테스트 없으면 PR마다 기능 검증을 수동으로 해야 함. WebSocket이나 Kafka consume 버그는 테스트 없이 잡기 어려움
- **목표 구조**:
```
backend/tests/
├── test_issues.py        # GET /issues 응답 코드, 데이터 포맷 검증
├── test_websocket.py     # WS 연결 및 broadcast 테스트
└── test_kafka.py         # mock consumer로 메시지 수신 테스트

frontend/__tests__/
├── IssueList.test.tsx    # 컴포넌트 렌더링 테스트
└── useWebSocket.test.ts  # 훅 재연결 로직 테스트
```
- **Month 1 최소 대응**: pytest로 `/health`, `GET /issues` 응답 코드만 확인

---

### 6. CloudFront 배포 방식
- **현재 구현**: App Router SSR 유지, K8s Pod으로 배포하는 옵션 B 기준으로 개발
```
Next.js build → Docker 이미지 → K8s Pod → CloudFront → Kong → Next.js
```
- **추후 결정 필요**: 정적 페이지만으로 가능하면 옵션 A(정적 빌드)로 전환 가능
- **필요한 이유**: 실시간 WebSocket + Keycloak SSR이 필요한 페이지가 있어서 정적 빌드가 안 될 수 있음. 반면 정적으로 가면 S3+CloudFront만으로 배포가 단순해짐. 김용균과 인프라 구성 확정 후 결정 필요
- **옵션 비교**:

| | 옵션 A (정적) | 옵션 B (SSR, 현재) |
|---|---|---|
| 배포 방식 | S3 + CloudFront | K8s Pod + CloudFront |
| 복잡도 | 단순 | 복잡 |
| SSR 지원 | 불가 | 가능 |
| 비용 | 낮음 | 높음 |

---

### 7. Redis 캐시 전략
- **현재 구현**: TTL 60초 고정, 캐시 무효화 없이 만료 후 재조회
```python
# backend/app/services/redis_client.py
async def get_issues():
    cached = await redis.get("issues:list")
    if cached:
        return json.loads(cached)
    data = await fetch_latest()
    await redis.setex("issues:list", 60, json.dumps(data))  # TTL 60초 고정
    return data
```
- **추후 결정 필요**: 실시간성 요구 수준 확인 후 TTL 조정 및 캐시 무효화 추가
- **필요한 이유**: Wikipedia 편집 폭증이 감지되는 순간 즉시 반영이 필요한 서비스인데, TTL 60초면 최대 1분 지연이 생김. 반면 TTL을 너무 낮추면 Redis 의미가 없어짐
- **추후 적용 예시**:
```python
# alerts 이벤트 수신 시 캐시 즉시 삭제
await redis.delete("issues:list")  # 다음 요청 시 최신 데이터 조회
```

---

### 8. Kong Gateway 로컬 대체
- **현재 구현**: Kong 없이 FastAPI 직접 호출, 환경변수로 분기
```env
# .env.local (로컬)
NEXT_PUBLIC_API_URL=http://localhost:8000

# .env.production (운영)
NEXT_PUBLIC_API_URL=http://kong:8000
```
- **추후 결정 필요**: K8s 환경에서 Kong 실제 연동 시 JWT 미들웨어 제거 여부 결정
- **필요한 이유**: 로컬에서는 FastAPI 미들웨어로 JWT 검증하고, 운영에서는 Kong이 처리하면 미들웨어가 중복됨. Kong 올라온 후 미들웨어 제거할지 유지할지 결정 필요
- **확인 대상**: 김용균 — Kong 운영 환경 준비 시점

---

### 9. 상태 관리 (프론트엔드)
- **현재 구현**: React Context로 전역 상태 관리 (의존성 최소화)
```typescript
// frontend/lib/context/IssueContext.tsx
const IssueContext = createContext<IssueState | null>(null);

export function IssueProvider({ children }: { children: ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [connected, setConnected] = useState(false);
  return (
    <IssueContext.Provider value={{ issues, setIssues, connected, setConnected }}>
      {children}
    </IssueContext.Provider>
  );
}
```
- **추후 결정 필요**: 상태가 복잡해지면 Zustand로 교체
- **필요한 이유**: Context는 단순하지만 상태가 많아지면 리렌더링 성능 문제가 생김. WebSocket 실시간 데이터가 여러 컴포넌트에 동시에 뿌려지는 구조라 나중에 병목이 될 수 있음
- **교체 기준**: Context가 3개 이상 중첩되거나 렌더링 성능 문제 발생 시
- **Zustand 전환 예시** (추후 적용):
```typescript
const useIssueStore = create<IssueState>((set) => ({
  issues: [],
  connected: false,
  setIssues: (issues) => set({ issues }),
  setConnected: (connected) => set({ connected }),
}));
```

---

### 10. WebSocket 메시지 타입 구조
- **현재 구현**: type 필드로 메시지 종류 구분
```json
{ "type": "sentiment", "data": { "issue_id": "...", "sentiment": "positive", "score": 0.92 } }
{ "type": "briefing",  "data": { "issue_id": "...", "summary": "...", "key_points": [...] } }
{ "type": "spike",     "data": { "wiki_page": "...", "edit_count": 20, "window": "5m" } }
```
```typescript
// frontend/hooks/useWebSocket.ts
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === "sentiment") setSentiment(data);
  if (type === "briefing")  setBriefing(data);
  if (type === "spike")     setSpike(data);
};
```
- **추후 결정 필요**: 데이터팀·AI팀과 type 필드 값 및 data 구조 최종 합의
- **필요한 이유**: `/ws/issues` 하나로 sentiment, briefing, spike 세 종류 메시지가 섞여 오는데, type 필드 이름이나 data 구조가 팀마다 다르게 구현되면 프론트에서 파싱 오류 발생

---

### 11. API 페이지네이션
- **현재 구현**: `GET /issues`에 페이지네이션 없이 최신 20개 고정 반환
```python
# backend/app/api/issues.py
@router.get("/issues")
async def get_issues():
    return await redis.get_latest(limit=20)  # 고정 20개
```
- **추후 결정 필요**: 이슈가 쌓이면 페이지네이션 또는 무한 스크롤 추가
- **필요한 이유**: 운영 환경에서 이슈가 수백 개 쌓이면 전부 내려주면 응답이 느려짐. 히스토리 검색 기능도 페이지네이션 없이는 구현이 어려움
- **추후 적용 예시**:
```
GET /issues?page=1&limit=20
GET /issues?cursor=last_issue_id&limit=20  # 커서 기반 (실시간 피드에 적합)
```

---

### 12. API 응답 포맷 표준화
- **현재 구현**: FastAPI 기본 응답 포맷 사용
```json
// 현재: 성공 시 데이터 그대로 반환
[{ "issue_id": "...", "title": "..." }]

// 현재: 에러 시 FastAPI 기본 포맷
{ "detail": "Issue not found" }
```
- **추후 결정 필요**: 팀 전체 API 응답 포맷 표준화
- **필요한 이유**: 프론트에서 성공/실패를 일관되게 처리하려면 응답 구조가 통일되어야 함. 지금은 에러마다 구조가 달라서 프론트 에러 핸들링 코드가 복잡해짐
- **권장 포맷**:
```json
// 성공
{ "status": "ok", "data": [...] }
// 실패
{ "status": "error", "code": 404, "message": "Issue not found" }
```

---

### 13. 로그 포맷
- **현재 구현**: FastAPI 기본 로그 (텍스트 포맷)
```
INFO:     uvicorn running on http://0.0.0.0:8000
INFO:     GET /issues - 200
```
- **추후 결정 필요**: 조승연(SRE팀) FluentBit + Loki 수집 구조에 맞게 JSON 포맷으로 변경
- **필요한 이유**: FluentBit이 로그를 파싱해서 Loki에 넣는데, 텍스트 포맷이면 파싱이 안 되거나 별도 파서 설정이 필요함. JSON 포맷으로 맞추면 바로 수집 가능
- **추후 적용 예시**:
```python
# backend/app/core/logging.py
import structlog
logger = structlog.get_logger()
logger.info("request", method="GET", path="/issues", status=200, service="wikipulse-api")
# 출력: {"level": "info", "method": "GET", "path": "/issues", "status": 200, "service": "wikipulse-api"}
```
- **확인 대상**: 조승연 — FluentBit 파서 설정, 필요한 로그 필드 확인

---

### 14. Dockerfile 최적화
- **현재 구현**: 단순 단일 스테이지 Dockerfile
```dockerfile
# backend/Dockerfile (현재)
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install poetry && poetry install
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```
- **추후 결정 필요**: 멀티스테이지 빌드로 이미지 크기 최적화
- **필요한 이유**: K8s에 올라가는 이미지라 크기가 크면 배포 속도가 느려지고 레지스트리 용량을 많이 씀. 멀티스테이지 빌드로 빌드 의존성을 최종 이미지에서 제거하면 이미지 크기를 크게 줄일 수 있음
- **추후 적용 예시**:
```dockerfile
# 빌드 스테이지
FROM python:3.11-slim AS builder
WORKDIR /app
RUN pip install poetry
COPY pyproject.toml .
RUN poetry export -f requirements.txt > requirements.txt

# 런타임 스테이지 (빌드 도구 제외)
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/requirements.txt .
RUN pip install -r requirements.txt
COPY app/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

---

### 15. 환경별 설정 분리
- **현재 구현**: `.env` 파일 하나로 관리
- **추후 결정 필요**: 로컬 / 운영 환경 분리
- **필요한 이유**: 로컬에서는 `localhost`, K8s에서는 서비스명으로 주소가 달라짐. 하나의 `.env`로 관리하면 배포할 때 실수로 로컬 주소가 운영에 들어갈 수 있음
- **권장 구조**:
```
backend/
├── .env.local       # 로컬 개발용 (localhost)
├── .env.production  # K8s 운영용 (서비스명)
└── .env.example     # 템플릿 (git 커밋)

frontend/
├── .env.local
├── .env.production
└── .env.example
```

---

## 팀 간 의존성

| 협업 대상 | 필요한 것 | 시점 |
|---|---|---|
| 김찬영 (데이터팀) | Kafka 토픽 스키마 확정 | 1주차 중 |
| 양성호 (AI팀) | Gemini 브리핑 JSON 포맷 | 1주차 중 |
| 윤승호 (DevSecOps) | Keycloak realm/client 설정, Kong WebSocket 지원 여부 | 1주차 |
| 김용균 (인프라) | ArgoCD 템플릿, Kong 운영 준비 시점 | 2주차 |
| 조승연 (SRE) | FluentBit 파서 설정, 필요한 로그 필드 | 2주차 |

---

## 환경변수 (.env.example)

```env
# Backend
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=wikipulse
KEYCLOAK_CLIENT_ID=wikipulse-api
REDIS_URL=redis://localhost:6379
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_GROUP_ID=service-team
AWS_REGION=ap-northeast-2
LAMBDA_FUNCTION_NAME=wikipulse-alert

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/issues
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
KEYCLOAK_ID=wikipulse-frontend
KEYCLOAK_SECRET=your-client-secret
KEYCLOAK_ISSUER=http://keycloak:8080/realms/wikipulse
```
