# WikiPulse 서비스팀 — 스프린트 상세 (Month 1~2)

## 담당 범위

### 백엔드 (FastAPI)
- 이슈 피드, 브리핑, 감성 결과, 타임라인, 알림 설정 REST API
- 유저 설정/북마크/계정 API (`/users/*`)
- WebSocket 실시간 이슈 스트림 (`/ws/issues`)
- Kong Gateway 연동 (라우팅, JWT 검증)
- ElastiCache Redis 연동 (이슈 캐싱)
- AWS Lambda + EventBridge (Discord/이메일 알림)
- Keycloak OIDC 연동

### 프론트엔드 (Next.js 14)
- 랜딩 페이지 (비로그인 트렌딩 이슈 미리보기)
- 로그인 UI (Keycloak OIDC)
- 온보딩 (첫 로그인 시 관심 카테고리 설정)
- 트렌딩 이슈 리스트 + 검색바 + 카테고리 필터
- 편집 스파이크 그래프 (WebSocket 실시간)
- Reddit 댓글 피드 (WebSocket 실시간)
- 감성 분포 차트 (WebSocket 실시간)
- AI 브리핑 카드 (WebSocket 실시간)
- 이슈 타임라인, 토픽 클러스터 시각화
- 히스토리 검색 (`/history`)
- 설정 페이지 (`/settings/account`, `/settings/preferences`, `/settings/bookmarks`, `/settings/alerts`)
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
│   │   │   ├── users.py
│   │   │   └── websocket.py
│   │   ├── services/
│   │   │   ├── kafka_consumer.py
│   │   │   ├── redis_client.py
│   │   │   └── lambda_trigger.py
│   │   ├── schemas/
│   │   └── core/
│   │       ├── config.py
│   │       └── auth.py
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── onboarding/
│   │   ├── issues/[id]/
│   │   ├── history/
│   │   └── settings/
│   │       ├── account/
│   │       ├── preferences/
│   │       ├── bookmarks/
│   │       └── alerts/
│   ├── components/
│   │   ├── IssueList.tsx
│   │   ├── SpikeChart.tsx
│   │   ├── SentimentChart.tsx
│   │   ├── BriefingCard.tsx
│   │   ├── CommentFeed.tsx
│   │   ├── IssueTimeline.tsx
│   │   └── SystemBanner.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useHealth.ts
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
│   ├── api-schema.md            # 팀 간 합의한 Kafka 스키마 기록용 (1주차 합의 후 작성)
│   └── decisions.md             # 아키텍처 결정 기록용
├── docker-compose.yml
└── CLAUDE.md
```

---

## 주별 목표

### 1주차 — 환경 세팅 & 뼈대 ✅
- [x] FastAPI 프로젝트 생성 (Poetry)
- [x] Next.js 14 프로젝트 생성 (TypeScript, App Router)
- [x] Docker Compose 로컬 개발환경 (FastAPI + Next.js + Redis)
- [x] Swagger UI 자동 생성 (`/docs`)
- [x] Keycloak OIDC next-auth 코드 설정 (로컬 서버는 Week 2에)
- [x] 로그인 페이지 UI 와이어프레임

> 비고: aioredis → redis[asyncio] 교체 (Python 3.12+ distutils 제거 이슈), next.config.ts → next.config.mjs (Next.js 14.2 미지원)

✅ **완료 기준**: `/health` 응답 ✅ + Next.js 로컬 실행 ✅ + 로그인 화면 렌더링 ✅

---

### 2주차 — 로그인 + 이슈 피드 REST API ✅
- [x] 로컬 mock Credentials 로그인 (Keycloak 없이 동작)
- [x] `GET /issues` Redis 캐시 + 미연결 fallback
- [x] 세션 토큰 → API 호출 연동
- [x] 트렌딩 이슈 리스트 컴포넌트 (status 뱃지 + 검색바 포함)
- [x] 미로그인 시 /login redirect
- [-] Kong Gateway 라우팅 설정 → 로컬은 env var 우회 유지, 김용균 확인 후 진행

> 비고: useSession status 체크 누락으로 초기 렌더에 401 발생 → status === "loading" 가드 추가

✅ **완료 기준**: 로그인 → 이슈 리스트 화면 진입 가능 ✅

---

### 3주차 — WebSocket + 실시간 차트 ✅
- [x] `WS /ws/issues` WebSocket 서버 구현
- [x] Kafka `sentiment-results`, `briefings`, `alerts`, `reddit-comments` consume → WebSocket broadcast
- [x] `useWebSocket` 커스텀 훅 구현 (자동 재연결 포함)
- [x] 편집 스파이크 그래프 (Recharts)
- [x] 감성 분포 차트 (실시간)
- [x] mock 데이터로 E2E 테스트

> 비고: `_MOCK_DIR = Path(__file__).parents[4]` → `parents[3]` 수정, `authOptions` → `lib/auth.ts` 분리, Session 타입에 `accessToken` 추가, WS 잘못된 토큰 시 1008 close 처리

✅ **완료 기준**: mock 데이터로 스파이크 그래프·감성 차트 실시간 업데이트 확인 ✅

---

### 4주차 — Reddit 피드 + 타임라인 + Month 1 마일스톤 ✅
- [x] Kafka `briefings` consume → WebSocket broadcast
- [x] `GET /issues/{id}/briefing` 구현 (mock 데이터 반환)
- [x] `POST /settings/alerts` + Lambda 트리거 연동
- [x] Reddit 댓글 피드 컴포넌트 (3줄 truncate + 더보기, 최신순/인기순 정렬)
- [x] 이슈 타임라인 컴포넌트 (REST API 초기 로드)
- [x] AI 브리핑 카드 프로토타입
- [x] 랜딩 페이지 (비로그인 이슈 미리보기 3개, `GET /issues?preview=true`)
- [x] 이슈 상세 페이지 (`/issues/[id]`) — WebSocket 실시간 연동
- [x] E2E pytest 22개 통과 (REST API + WebSocket + 유저 API)
- [ ] 팀 데모

> 비고: `reddit-comments` Kafka 토픽 추가 확인 (김찬영), Kong 비로그인 예외 설정 필요 (윤승호)

✅ **Month 1 마일스톤**: 편집 폭증 이벤트 → 대시보드 실시간 반영 E2E 흐름 동작

---

### 5주차 — 유저 API + 에러 처리 + 검색 ✅
- [ ] Kong Gateway 실제 연동 (김용균 ArgoCD 템플릿 기준)
- [ ] WebSocket 인증 방식 확정 (윤승호 확인 후 Kong 플러그인 or FastAPI 직접 유지)
- [x] Kafka consume 실패 에러 처리 (재시도 3회 + `_kafka_healthy` 플래그 + `/health` 노출)
- [x] Redis 장애 fallback 고도화 (소켓 타임아웃 2s + `_redis_healthy` 플래그 + `/health` 노출)
- [x] Kafka/Redis 장애 시 프론트 경고 배너 (`useHealth` 훅 + `SystemBanner` 컴포넌트)
- [x] 유저 설정 API (`GET /users/me`, `PATCH /users/me`)
- [x] 북마크 API (`GET /users/bookmarks`, `POST /users/bookmarks`, `DELETE /users/bookmarks/{id}`)
- [x] 관심 카테고리 API (`GET /users/preferences`, `POST /users/preferences`)
- [x] 이슈 검색 API (`GET /issues?q=keyword`) + 프론트 검색바 연동
- [x] 아카이브 이슈 API (`GET /issues/archived`)
- [x] Issue 스키마에 `status` 필드 추가 + 프론트 뱃지 표시
- [x] 설정 페이지 API 연동 (`/settings/account`, `/settings/bookmarks`, `/settings/preferences`)

✅ **완료 기준**: Kong 통해서 API 호출 성공 + 에러 상황에서 UI가 멈추지 않음

---

### 6주차 — Keycloak SSO + 네비게이션 + 알림
- [ ] Keycloak 실제 서버 연동 (윤승호 realm/client 설정 기준)
- [ ] next-auth CredentialsProvider → KeycloakProvider 교체
- [x] `/onboarding` 페이지 구현 (첫 로그인 시 관심 카테고리 선택)
- [x] `/settings/alerts` 알림 설정 폼 완성 (`POST /alerts/settings`)
- [x] 네비게이션/헤더 컴포넌트 (로그인 상태, 메뉴 링크)
- [x] Redis TTL 전략 조정 (alerts 이벤트 수신 시 캐시 즉시 무효화)
- [ ] AI 브리핑 카드 완성 (WebSocket 실시간)
- [ ] API 응답 포맷 표준화 적용 (`{ status, data }` 구조)
- [x] JSON 로그 포맷 적용 (structlog, 조승연 FluentBit 파서 기준)

✅ **완료 기준**: Keycloak 로그인 → 설정 페이지 실제 저장/조회 동작

---

### 7주차 — Lambda 알림 + CloudFront 배포 + 히스토리
- [ ] Lambda Discord/이메일 알림 완성 (EventBridge 트리거)
- [x] `/history` 페이지 구현 (`GET /issues/archived` 연동, 키워드 검색)
- [x] `GET /issues` cursor 기반 페이지네이션 + 프론트 "더 보기" 버튼
- [x] 404 페이지 구현
- [x] 로딩 스켈레톤 UI (이슈 리스트, 이슈 상세)
- [ ] 토픽 클러스터 시각화 컴포넌트
- [ ] CloudFront 배포 방식 확정 (김용균과 옵션 A/B 결정 후 적용)
- [ ] k8s/ 폴더 Deployment·Service yaml 추가 (인프라팀 템플릿 기준)
- [x] 환경별 설정 분리 (.env.local / .env.production)
- [x] Dockerfile 멀티스테이지 빌드 최적화 (백엔드)

✅ **완료 기준**: Discord 알림 수신 확인 + CloudFront URL로 대시보드 접근 가능

---

### 8주차 — UI 폴리싱 + 테스트 + 안정화 + Month 2 마일스톤
- [ ] Kafka 실제 스키마 연동 (김찬영·양성호 확정 후 mock → 실데이터 교체)
- [ ] Jest 컴포넌트 테스트 (IssueList, useWebSocket)
- [ ] k6 API 부하 테스트
- [ ] 상태 관리 성능 검토 (Context 유지 or Zustand 전환)
- [ ] 전체 E2E 시나리오 테스트 (로그인 → 이슈 상세 → 알림 설정 흐름)
- [x] UI 폴리싱 — Deep Navy + Royal Blue 테마 전면 적용 (Tailwind custom colors: navy, surface, blue-glow shadows)
- [x] 상태 컬러 시스템 — 발생(sky-400) / 확산(blue-500) / 정점(orange-400) / 소강(slate-500) + 네온 dot glow
- [x] Sparkline — issue_id 시드 기반 결정론적 SVG 미니 그래프, 모든 이슈 카드 우측 표시
- [x] Live Indicator — WikiPulse 로고 옆 animate-ping 레드 점(#FF4848), Trend 탭바 우측 블루 점
- [x] 이슈 상세 페이지 2단 그리드 — max-w-5xl, lg:grid-cols-[1.2fr_1fr], 좌(Spike+Timeline)/우(Sentiment+Comments)
- [x] BriefingCard — 숫자·단위 자동 Royal Blue 하이라이팅, AI sparkle 아이콘, glow 강화 border
- [x] IssueTimeline — 그라데이션 커넥팅 라인, 타입별 glow 노드, stroke-only 미니멀 아이콘
- [x] SystemBanner — 다크 앰버 배경(#1A1502) + 머스타드 옐로우(amber-400) Warning 배너
- [x] SentimentChart — 도넛 중앙 숫자 대형화(text-3xl) + Total 라벨
- [x] CommentFeed — 슬림 Royal Blue 커스텀 스크롤바
- [x] Archive 페이지 개편 — 월별 그룹핑, 기간 필터(3개월/6개월/1년), 그룹별 더보기, 정렬(최신순/편집 많은순)
- [x] Trend 이슈 피드 개편 — 상태별 좌측 컬러 보더, 상대 시간, 검색 아이콘 통합
- [x] 홈 페이지 개편 — 미니멀 랜딩, 이슈 미리보기 카드 클릭 전체 링크
- [x] 네비게이션 개편 — 페이지명 영문화(Trend/Archive), 설정 톱니바퀴 아이콘
- [x] GET /issues/{id} — archived 이슈 ID 조회 지원 추가
- [x] mock 아카이브 데이터 10건으로 확장, 월별 분산 배치
- [ ] 라이트/다크 테마 전환 (next-themes + dark: 변형 — 실데이터 연동 후 진행)
- [ ] 팀 데모 준비

✅ **Month 2 마일스톤**: Wikipedia SSE → 폭증 감지 → Reddit 수집 → NLP + LLM 브리핑 → 대시보드 E2E 완성, Keycloak SSO + CloudFront 배포 + Discord 알림 전부 동작

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
  "sentiment_score": 0.92,
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
- **필요한 이유**: 스키마가 다르면 FastAPI consume 코드와 프론트 렌더링 코드를 전부 다시 짜야 함
- **확인 대상**: 김찬영(sentiment-results, alerts 토픽), 양성호(briefings 토픽)

---

### 2. K8s 배포 연동
- **현재 구현**: Docker Compose 로컬 개발환경만 구성, `k8s/` 폴더 비어있음
- **추후 결정 필요**: 김용균(인프라팀)에게 ArgoCD 템플릿 받아서 `k8s/` 폴더에 추가 (7주차)
- **필요한 이유**: ArgoCD가 바라보는 레포/브랜치/경로가 정해져 있어서 구조가 안 맞으면 자동 배포가 안 됨
- **확인 대상**: 김용균 — ArgoCD 레포 구조, Deployment/Service yaml 템플릿

---

### 3. WebSocket 인증
- **현재 구현**: FastAPI에서 쿼리파라미터로 JWT 받아서 직접 검증
```python
# backend/app/api/websocket.py
@app.websocket("/ws/issues")
async def issue_stream(websocket: WebSocket, token: str = Query(...)):
    payload = verify_jwt(token)
    await websocket.accept()
```
```typescript
// frontend/hooks/useWebSocket.ts
const ws = new WebSocket(`ws://host/ws/issues?token=${jwtToken}`);
```
- **추후 결정 필요**: Kong WebSocket upgrade 요청 JWT 검증 지원 여부 확인 후 교체 가능 (5주차)
- **필요한 이유**: Kong에서 처리하면 FastAPI 검증 코드 제거 가능하고 보안 정책이 한 곳에서 관리됨
- **확인 대상**: 윤승호 — Kong WebSocket 플러그인 지원 여부

---

### 4. 에러 처리 / 로딩 상태
- **현재 구현**: WebSocket 자동 재연결 + 로딩 스피너만 구현
```typescript
// frontend/hooks/useWebSocket.ts
const reconnect = () => setTimeout(() => connect(), 3000);
ws.onclose = reconnect;
```
```python
# backend/app/services/kafka_consumer.py
for attempt in range(3):
    try:
        await consumer.start()
        break
    except Exception:
        await asyncio.sleep(2)
```
- **추후 결정 필요**: Month 2 (5주차)에서 케이스별 에러 처리 고도화
- **필요한 이유**: 운영 환경에서 Kafka/Redis 장애 시 사용자에게 피드백 없으면 서비스가 그냥 멈춰 보임

| 상황 | 추후 백엔드 | 추후 프론트 |
|---|---|---|
| Kafka consume 실패 | 재시도 3회 후 알림 로그 | "데이터 로딩 중" 배너 |
| Redis 장애 | DB 직접 조회 fallback | 그대로 표시 |
| WebSocket 끊김 | - | 3초 후 자동 재연결 (이미 구현) |

---

### 5. 테스트 전략
- **현재 구현**: 테스트 없이 로컬 실행으로만 검증
- **추후 결정 필요**: Month 2 (8주차)에서 테스트 코드 추가
- **필요한 이유**: CI에서 CodeQL + Ruff가 돌아가는데 테스트 없으면 PR마다 기능 검증을 수동으로 해야 함
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

---

### 6. CloudFront 배포 방식
- **현재 구현**: App Router SSR 유지, K8s Pod 기준으로 개발
```
Next.js build → Docker 이미지 → K8s Pod → CloudFront → Kong → Next.js
```
- **추후 결정 필요**: 정적 빌드 가능하면 옵션 A로 전환 (7주차, 김용균 확인 후)
- **필요한 이유**: SSR 필요 여부에 따라 배포 구조가 완전히 달라짐

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
await redis.setex("issues:list", 60, json.dumps(data))
```
- **추후 결정 필요**: alerts 이벤트 수신 시 캐시 즉시 무효화 추가 (6주차)
- **필요한 이유**: 편집 폭증 감지 즉시 반영이 필요한데 TTL 60초면 최대 1분 지연 발생
- **추후 적용 예시**:
```python
await redis.delete("issues:list")  # alerts 이벤트 수신 시 즉시 삭제
```

---

### 8. Kong Gateway 로컬 대체
- **현재 구현**: Kong 없이 FastAPI 직접 호출, 환경변수로 분기
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
# .env.production
NEXT_PUBLIC_API_URL=http://kong:8000
```
- **추후 결정 필요**: K8s 환경 Kong 연동 시 FastAPI JWT 미들웨어 제거 여부 (5주차)
- **필요한 이유**: Kong이 JWT 검증하면 FastAPI 미들웨어가 중복됨
- **확인 대상**: 김용균 — Kong 운영 환경 준비 시점

---

### 9. 상태 관리 (프론트엔드)
- **현재 구현**: React Context로 전역 상태 관리
```typescript
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
- **추후 결정 필요**: 상태 복잡도 증가 시 Zustand 전환 (8주차 성능 검토)
- **필요한 이유**: WebSocket 실시간 데이터가 여러 컴포넌트에 동시에 뿌려지는 구조라 Context 리렌더링 병목 가능
- **교체 기준**: Context 3개 이상 중첩 또는 렌더링 성능 문제 발생 시
- **Zustand 전환 예시**:
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
{ "type": "sentiment", "data": { "issue_id": "...", "sentiment": "positive", "sentiment_score": 0.92 } }
{ "type": "briefing",  "data": { "issue_id": "...", "summary": "...", "key_points": [...] } }
{ "type": "spike",     "data": { "wiki_page": "...", "edit_count": 20, "window": "5m" } }
```
```typescript
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  if (type === "sentiment") setSentiment(data);
  if (type === "briefing")  setBriefing(data);
  if (type === "spike")     setSpike(data);
};
```
- **추후 결정 필요**: 데이터팀·AI팀과 type 필드 값 및 data 구조 최종 합의 (3주차 중)
- **필요한 이유**: type 이름이나 data 구조가 팀마다 다르면 프론트에서 파싱 오류 발생

---

### 11. API 페이지네이션
- **현재 구현**: `GET /issues` 최신 20개 고정 반환
```python
@router.get("/issues")
async def get_issues():
    return await redis.get_latest(limit=20)
```
- **추후 결정 필요**: 이슈 증가 시 페이지네이션 또는 무한 스크롤 추가 (7주차)
- **필요한 이유**: 히스토리 검색 기능 구현에 페이지네이션 필수
- **추후 적용 예시**:
```
GET /issues?cursor=last_issue_id&limit=20  # 커서 기반 (실시간 피드에 적합)
```

---

### 12. API 응답 포맷 표준화
- **현재 구현**: FastAPI 기본 응답 포맷
```json
// 성공: 데이터 그대로 반환
[{ "issue_id": "...", "title": "..." }]
// 에러: FastAPI 기본 포맷
{ "detail": "Issue not found" }
```
- **추후 결정 필요**: 표준 응답 포맷으로 통일 (6주차)
- **필요한 이유**: 에러마다 구조가 달라서 프론트 에러 핸들링 코드가 복잡해짐
- **권장 포맷**:
```json
{ "status": "ok", "data": [...] }
{ "status": "error", "code": 404, "message": "Issue not found" }
```

---

### 13. 로그 포맷
- **현재 구현**: FastAPI 기본 텍스트 로그
```
INFO:     GET /issues - 200
```
- **추후 결정 필요**: JSON 포맷으로 변경 (6주차, 조승연 FluentBit 파서 기준)
- **필요한 이유**: FluentBit이 텍스트 로그 파싱 불가 → Loki 수집 안 됨
- **추후 적용 예시**:
```python
import structlog
logger = structlog.get_logger()
logger.info("request", method="GET", path="/issues", status=200, service="wikipulse-api")
```
- **확인 대상**: 조승연 — FluentBit 파서 설정, 필요한 로그 필드

---

### 14. Dockerfile 최적화
- **현재 구현**: 단일 스테이지 Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install poetry && poetry install
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```
- **추후 결정 필요**: 멀티스테이지 빌드로 이미지 크기 최적화 (7주차)
- **필요한 이유**: K8s 배포 이미지가 크면 배포 속도 저하 + 레지스트리 용량 낭비
- **추후 적용 예시**:
```dockerfile
FROM python:3.11-slim AS builder
RUN pip install poetry
COPY pyproject.toml .
RUN poetry export -f requirements.txt > requirements.txt

FROM python:3.11-slim
COPY --from=builder /app/requirements.txt .
RUN pip install -r requirements.txt
COPY app/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]
```

---

### 15. 환경별 설정 분리
- **현재 구현**: `.env` 파일 하나로 관리
- **추후 결정 필요**: 로컬 / 운영 환경 분리 (7주차)
- **필요한 이유**: 배포 시 실수로 로컬 주소(localhost)가 운영에 들어갈 수 있음
- **권장 구조**:
```
backend/
├── .env.local       # 로컬 (localhost)
├── .env.production  # K8s 운영 (서비스명)
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
| 김찬영 (데이터팀) | Kafka 토픽 스키마 확정 (`reddit-comments` 포함), 이슈 생애주기 상태 판단 주체 결정, `alerts` 토픽 메시지에 `status` 필드 포함 요청 (발생/확산/정점/소강 실시간 업데이트용) | 3주차 중 |
| 양성호 (AI팀) | Gemini 브리핑 JSON 포맷, WebSocket 메시지 타입 합의, sentiment_score 정의, 중립성 프롬프트 가이드라인 | 3주차 중 |
| 윤승호 (DevSecOps) | Keycloak realm/client 설정, Kong WebSocket 지원 여부, Keycloak self-registration 허용 여부 | 5~6주차 |
| 김용균 (인프라) | ArgoCD 템플릿, Kong 운영 준비 시점, CloudFront 배포 방식 확정, 유저 데이터 영구 저장 DB 결정 (PostgreSQL 여부) | 5~7주차 |
| 조승연 (SRE) | FluentBit 파서 설정, 필요한 로그 필드 | 6주차 |

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
USE_MOCK=true

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/issues
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
KEYCLOAK_ID=wikipulse-frontend
KEYCLOAK_SECRET=your-client-secret
KEYCLOAK_ISSUER=http://keycloak:8080/realms/wikipulse
```
