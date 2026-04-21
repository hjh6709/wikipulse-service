# API & Kafka Schema

팀 간 합의한 스키마를 기록하는 문서입니다.
TBD 항목은 김찬영(데이터팀), 양성호(AI팀)과 합의 후 업데이트합니다.

---

## REST API

### Issue

`GET /issues` 및 `GET /issues/{id}` 응답에서 사용합니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `issue_id` | string | 이슈 고유 ID |
| `title` | string | Wikipedia 문서 제목 |
| `wiki_page` | string | Wikipedia 문서 슬러그 (URL 경로) |
| `status` | 발생\|확산\|정점\|소강 | 이슈 생애주기 상태 |
| `edit_count` | int | 특정 시간 window 안의 편집 횟수 (절대값) |
| `spike_score` | float (0~1) | 평소 대비 편집 폭증 정도 (상대값, 높을수록 이상 징후) |
| `updated_at` | datetime | 마지막 업데이트 시각 |

> `edit_count`와 `spike_score` 계산 방식 — 김찬영(데이터팀) 확인 필요
> `wiki_page` 타입 (URL 전체 vs 슬러그 vs 문서 제목) — 김찬영 확인 필요
> `status` 판단 주체 (Kafka Streams vs 서비스팀 직접 계산) — 김찬영 확인 필요

---

### SentimentResult

`GET /issues/{id}/sentiment` 응답에서 사용합니다.
Reddit 댓글 하나에 대한 AI 감성 분석 결과입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `issue_id` | string | 이슈 고유 ID |
| `comment_id` | string | Reddit 댓글 ID |
| `sentiment` | positive \| negative \| neutral | AI 모델이 판단한 감성 |
| `sentiment_score` | float (0~1) | 해당 sentiment일 확신도 (1에 가까울수록 확신) |
| `timestamp` | datetime | 분석 시각 |

> `sentiment` 세분화 여부 (3분류 유지 or joy/anger 등 확장), `score` 정확한 의미 — 양성호(AI팀) 확인 필요

---

### Briefing

`GET /issues/{id}/briefing` 응답에서 사용합니다.
AI팀이 생성한 이슈 요약 브리핑입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `issue_id` | string | 이슈 고유 ID |
| `summary` | string | Gemini가 생성한 이슈 요약 |
| `key_points` | string[] | 핵심 포인트 목록 |
| `created_at` | datetime | 브리핑 생성 시각 |

> 브리핑 생성 주기, `key_points` 개수 제한 — 양성호(AI팀) 확인 필요

---

### UserSettings

`GET /users/me` — 로그인 유저 계정 정보

| 필드 | 타입 | 설명 |
|---|---|---|
| `user_id` | string | Keycloak 유저 ID |
| `username` | string | 유저명 |
| `email` | string | 이메일 |

`PATCH /users/me` — 계정 정보 수정 (요청 바디: username, email)

---

### Bookmark

`GET /users/bookmarks` — 북마크 목록 / `POST /users/bookmarks` — 북마크 추가 / `DELETE /users/bookmarks/{id}` — 북마크 삭제

| 필드 | 타입 | 설명 |
|---|---|---|
| `bookmark_id` | string | 북마크 고유 ID |
| `issue_id` | string | 북마크한 이슈 ID |
| `created_at` | datetime | 북마크 생성 시각 |

> 영구 저장 DB 결정 후 구현 — 김용균(인프라팀) 확인 필요

---

### UserPreferences

`GET /users/preferences` — 관심 카테고리 조회 / `POST /users/preferences` — 관심 카테고리 저장

| 필드 | 타입 | 설명 |
|---|---|---|
| `categories` | string[] | 관심 카테고리 목록 (정치/경제/스포츠/연예/사회·범죄/과학·기술) |

> 영구 저장 DB 결정 후 구현 — 김용균(인프라팀) 확인 필요

---

### AlertSettings

`POST /settings/alerts` 요청 바디입니다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `issue_id` | string | 알림 설정할 이슈 ID |
| `threshold` | int | 알림 발송 기준 edit_count |
| `channels` | discord \| email[] | 알림 채널 목록 |

---

## Kafka 토픽

### reddit-comments

데이터팀(김찬영)이 Reddit 댓글 원문을 수집해서 발행합니다.
서비스팀(한정현)과 AI팀(양성호) 둘 다 consume합니다.

```json
{
  "comment_id": "string",
  "post_id": "string",
  "issue_id": "string",
  "author": "string",
  "body": "string",
  "score": 142,
  "created_at": "2026-04-20T00:00:00Z"
}
```

> 실제 스키마 확정 전까지 `mock/comments.json` 기준으로 개발

---

### sentiment-results

AI팀(양성호)이 `reddit-comments` 토픽을 consume → DistilBERT 분석 → 결과를 발행합니다.

```json
{
  "issue_id": "string",
  "comment_id": "string",
  "sentiment": "positive|negative|neutral",
  "sentiment_score": 0.92,
  "timestamp": "2026-04-20T00:00:00Z"
}
```

> 실제 스키마 확정 전까지 `mock/sentiment-results.json` 기준으로 개발

**데이터 흐름:**
```
reddit-comments 토픽 (김찬영 발행)

    ↓ 서비스팀 consume (원본 댓글)

    ↓ AI팀 consume → DistilBERT 분석
    
sentiment-results 토픽 (양성호 발행)

    ↓ 서비스팀 consume (분석 결과)
    
→ comment_id로 매칭 → WebSocket으로 프론트에 합쳐서 전달
```

**양성호 확인 필요:**
1. `sentiment-results` 메시지에 `comment_id` 포함 여부 (원본 댓글과 매칭용)
2. `reddit-comments` consume → 분석 완료까지 딜레이가 얼마나 되는지
3. 합쳐서 보내는 방식 vs 별도 메시지로 보내는 방식 중 어느 쪽이 나은지

**확정 후 구현 계획:**
```typescript
// comment_id로 매칭해서 한 번에 전달하는 방식
{ "type": "comment", "data": {
    "comment_id": "abc",
    "body": "원본 댓글",
    "author": "user1",
    "score": 142,
    "sentiment": "positive",
    "sentiment_score": 0.92
}}
```

---

### briefings

AI팀(양성호)이 Gemini 브리핑 결과를 발행합니다.

```json
{
  "issue_id": "string",
  "summary": "string",
  "key_points": ["string"],
  "created_at": "2026-04-20T00:00:00Z"
}
```

> 실제 스키마 확정 전까지 `mock/briefings.json` 기준으로 개발

---

### alerts

데이터팀(김찬영)이 편집 폭증 이벤트를 발행합니다.

```json
{
  "issue_id": "string",
  "wiki_page": "string",
  "edit_count": 22,
  "window": "5m",
  "triggered_at": "2026-04-20T00:00:00Z"
}
```

> 실제 스키마 확정 전까지 `mock/alerts.json` 기준으로 개발

#### 김찬영 확인 필요

**확인 항목:**
1. `alerts` 토픽 메시지에 `status` 필드 추가 가능한지
2. status 판단 기준이 무엇인지 (edit_count 임계값인지, 시간 window 내 변화율인지)
3. status 변경 이벤트가 별도 토픽으로 나오는지, alerts 토픽에 포함되는지

**확정 후 구현 계획:**

1. `alerts` 토픽에 `status` 포함 시 → 백엔드 스키마 업데이트
```json
{
  "issue_id": "string",
  "wiki_page": "string",
  "edit_count": 22,
  "window": "5m",
  "status": "확산",
  "triggered_at": "2026-04-20T00:00:00Z"
}
```

2. 백엔드 Kafka consumer에서 status 수신 → Redis 캐시 업데이트
```python
# kafka_consumer.py
if msg.topic == "alerts":
    await update_issue_status(data["issue_id"], data["status"])
    await invalidate_issues_cache()
```

3. WebSocket broadcast에 status 포함 → 프론트 실시간 반영
```json
{ "type": "spike", "data": { "issue_id": "...", "edit_count": 22, "status": "확산" } }
```

4. 프론트 `IssueList`에서 WebSocket spike 메시지 수신 시 해당 이슈 status 뱃지 즉시 갱신
```typescript
if (lastMessage.type === "spike") {
  const { issue_id, status } = lastMessage.data;
  setIssues(prev => prev.map(i => i.issue_id === issue_id ? { ...i, status } : i));
}
```

---

## WebSocket 메시지 타입

`WS /ws/issues` 에서 수신하는 메시지 형식입니다.
`type` 필드로 메시지 종류를 구분합니다.

```json
{ "type": "briefing",  "data": { ...Briefing } }
{ "type": "spike",     "data": { "wiki_page": "...", "edit_count": 22, "window": "5m", "status": "확산" } }
{ "type": "comment",   "data": {
    "comment_id": "string",
    "body": "string",
    "author": "string",
    "score": 142,
    "sentiment": "positive|negative|neutral",
    "sentiment_score": 0.92
}}
```

**변경 사항:**
- `sentiment` 타입 별도 제거 → `comment` 타입에 sentiment 필드 합산 (`comment_id` 기준 매칭)
- `spike` 타입에 `status` 필드 추가 (김찬영 확인 후)

> `type` 필드 값 및 `data` 구조 최종 합의 — 김찬영, 양성호 확인 필요

---

## Wikipedia SSE (Wikimedia EventStreams)

데이터팀(김찬영)이 Wikipedia 편집 이벤트를 수집하는 소스입니다.

**엔드포인트:** `https://stream.wikimedia.org/v2/stream/recentchange`

**주요 필드:**

| 필드 | 타입 | 설명 |
|---|---|---|
| `title` | string | Wikipedia 문서 제목 (이슈 제목 기준) |
| `type` | edit \| new \| log \| categorize \| external | 이벤트 유형 — 편집 폭증 감지에는 `edit`만 사용 |
| `timestamp` | int (Unix) | 편집 발생 시각 |
| `user` | string | 편집자 (IP 또는 사용자명) |
| `comment` | string | 편집 요약 (수정 내용 힌트) |
| `bot` | bool | 봇 편집 여부 — 폭증 감지 시 제외 여부 결정 필요 |
| `minor` | bool | 사소한 편집 여부 |
| `length.old` / `length.new` | int | 편집 전후 문서 길이 (바이트) |
| `revision.old` / `revision.new` | int | 리비전 ID |
| `namespace` | int | 0 = 본문, 1 = Talk, 4 = Wikipedia: 등 — 본문(0)만 사용 |
| `wiki` | string | `enwiki`, `kowiki` 등 언어별 위키 구분 |
| `meta.domain` | string | `canary` 이벤트는 필터 필요 (`meta.domain !== 'canary'`) |
| `meta.dt` | datetime | 이벤트 발행 시각 (ISO 8601) |

**issue_id 설계 관련 고려사항:**

같은 Wikipedia 문서(`title`)에서도 서로 다른 사건으로 인해 편집 폭증이 여러 번 발생할 수 있습니다. 예를 들어 `ChatGPT` 문서가 A사건으로 폭증하고, 이후 B사건으로 다시 폭증하면 이 둘은 별개의 이슈여야 합니다.

따라서 `issue_id`는 **문서 제목 + 시간 단위 조합**으로 생성하는 방식이 적합합니다:
- 예: `chatgpt_20260421_1400` (문서 + 날짜 + 시간 단위)
- 또는 `enwiki_chatgpt_rev12345678` (wiki + 제목 + 트리거 리비전 ID)

> `issue_id` 생성 주체 및 형식 — 김찬영 확인 필요 (아래 TBD 참조)

---

## TBD 목록

| 항목 | 확인 대상 | 시점 |
|---|---|---|
| `issue_id` 생성 주체 및 형식 (문서+시간 조합 vs 리비전 ID 기반) | 김찬영 | 8주차 |
| Wikipedia SSE `bot` 편집 폭증 감지 시 제외 여부 | 김찬영 | 8주차 |
| `edit_count` window 크기, `spike_score` 계산 방식 | 김찬영 | 4주차 |
| `wiki_page` 타입 (URL 전체 vs 슬러그 vs 문서 제목) | 김찬영 | 4주차 |
| Issue `status` 판단 주체 (Kafka Streams vs 서비스팀) | 김찬영 | 4주차 |
| `alerts` 토픽에 `status` 필드 추가 가능 여부 및 판단 기준 | 김찬영 | 7주차 |
| `reddit-comments` 토픽 스키마 확정 (필드, score 필드명 등) | 김찬영 | 4주차 |
| `sentiment` 분류 세분화 여부, `sentiment_score` 정확한 의미 | 양성호 | 4주차 |
| `sentiment-results` 메시지에 `comment_id` 포함 여부 (원본 댓글 매칭용) | 양성호 | 8주차 |
| `reddit-comments` consume → 분석 완료까지 딜레이 (합산 방식 결정용) | 양성호 | 8주차 |
| 브리핑 생성 주기, key_points 개수, 중립성 프롬프트 가이드라인 | 양성호 | 4주차 |
| WebSocket 메시지 type/data 구조 최종 합의 | 김찬영, 양성호 | 4주차 |
| Kong JWT 검증 예외 경로 설정 (`GET /issues?preview=true`) | 윤승호 | 5주차 |
| 유저 데이터 영구 저장 DB (PostgreSQL 여부, 온프렘 K8s vs RDS) | 김용균 | 5주차 |
| Keycloak self-registration 허용 여부 | 윤승호 | 5주차 |
