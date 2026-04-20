# WikiPulse — 팀 논의 필요 항목

현재 혼자 결정할 수 없는 항목들입니다. 팀 논의 후 결정되면 결과를 기록해두세요.

---

## 1. 유저 데이터 영구 저장 DB

**확인 대상:** 김용균 (인프라팀)

**배경:**
북마크, 유저 설정(관심 카테고리, 알림 설정)은 서버가 꺼져도 유지되어야 하는 영구 데이터입니다.
현재 기획서에 DB가 명시되어 있지 않고 Redis만 있는데, Redis는 캐시용이라 이런 데이터에 적합하지 않습니다.

**결정 필요 사항:**
- PostgreSQL 등 관계형 DB 추가 여부
- 온프렘 K8s에 올릴지, AWS RDS로 갈지

**영향 범위:** `/settings/bookmarks`, `/settings/preferences`, `/settings/account`, `/settings/alerts`

---

## 2. 이슈 생애주기 상태 판단 주체

**확인 대상:** 김찬영 (데이터팀)

**배경:**
이슈 상태(발생/확산/정점/소강)를 표시하려면 편집 횟수 추이를 시간 단위로 판단해야 합니다.

**결정 필요 사항:**
- Kafka Streams에서 상태를 판단해서 alerts 토픽에 포함해서 보낼지
- 서비스팀(우리)이 편집 횟수 추이를 보고 직접 판단할지

**영향 범위:** 이슈 카드 상태 뱃지, 홈 이슈 자동 제거, 아카이브 처리

---

## 3. AI 브리핑 중립성 프롬프트 가이드라인

**확인 대상:** 양성호 (AI팀)

**배경:**
정치/사회 이슈에서 AI 브리핑이 특정 성향으로 편향되면 안 됩니다.
"~라는 주장이 있습니다", "~측은 ~라고 말합니다" 형태로 중립을 유지해야 합니다.

**결정 필요 사항:**
- Gemini 프롬프트에 중립성 가이드라인 포함 여부
- 카테고리별 프롬프트 분기 여부 (정치/경제/연예 등)

**영향 범위:** AI 브리핑 카드 전체

---

## 4. 감성 분석 sentiment_score 정의

**확인 대상:** 양성호 (AI팀)

**배경:**
현재 mock 데이터에서 `sentiment_score`는 "해당 sentiment일 확신도"로 가정하고 있습니다.
실제 DistilBERT 모델의 출력값과 일치하는지 확인이 필요합니다.

**결정 필요 사항:**
- `sentiment_score`가 정확히 무엇을 의미하는지 (확신도 0~1 맞는지)
- 감성 분류를 3분류(positive/negative/neutral)로 유지할지, 세분화할지

**영향 범위:** `SentimentResult` 스키마, 감성 분포 차트

---

## 5. Keycloak 가입 방식

**확인 대상:** 윤승호 (DevSecOps)

**배경:**
WikiPulse가 외부 공개 서비스로 기획되어 있어서 누구나 가입할 수 있어야 할 수 있습니다.
Keycloak realm 설정에서 자가 가입(self-registration) 허용 여부를 결정해야 합니다.

**결정 필요 사항:**
- 누구나 가입 가능 (self-registration ON)
- 초대/승인 방식 (self-registration OFF)

**영향 범위:** 로그인 페이지 UI, 온보딩 플로우

---

## 6. CDN 선택 — CloudFront vs Cloudflare

**확인 대상:** 김용균 (인프라팀)

**배경:**
현재 계획은 AWS CloudFront로 잡혀 있으나, Cloudflare Pro ($20/월)는 대역폭 무제한 + WAF + DDoS 방어가 포함되어 트래픽이 늘수록 비용 면에서 유리합니다.
단, 현재 스택이 AWS 중심(ElastiCache, Lambda, K8s)이라 Cloudflare로 변경 시 CDN만 빠져나오는 구조가 됩니다.

**결정 필요 사항:**
- AWS CloudFront 유지 (인프라 일관성 우선)
- Cloudflare Pro로 전환 (비용 최적화 우선, 트래픽 증가 시점에 재검토)

**영향 범위:** CloudFront 배포 설정 (7주차), 인프라팀 ArgoCD 템플릿

---

## 결정 완료 항목

### aioredis → redis[asyncio] 교체
**날짜:** 2026-04-20

**배경:**
`aioredis`는 서드파티 라이브러리로 Python 내장 모듈 `distutils`에 의존합니다.
`distutils`는 Python 3.12부터 완전히 제거되어 Python 3.12+ 환경에서 `aioredis`가 동작하지 않습니다.

**결정:**
Redis 공식팀이 직접 만든 `redis[asyncio]`로 교체.
`redis-py`에 비동기 지원이 추가된 공식 라이브러리로, Python 최신 버전을 전부 지원하며 `aioredis`는 사실상 deprecated 상태입니다.

---

### next-auth mock 로그인 (CredentialsProvider)
**날짜:** 2026-04-20

**배경:**
로컬 개발 환경에 Keycloak 서버가 없어서 실제 OIDC 로그인이 불가능합니다.

**결정:**
next-auth `CredentialsProvider`로 아무 username/password나 입력하면 로그인되는 mock 로그인 구현.
내부적으로 백엔드와 동일한 비밀키(`wikipulse-dev-secret`)로 JWT를 생성해서 API 인증까지 동작합니다.
윤승호(DevSecOps)에게 Keycloak realm/client 설정을 받으면 `KeycloakProvider`로 교체 예정입니다.
