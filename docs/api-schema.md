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

AI팀(양성호)이 Reddit 댓글 감성 분석 결과를 발행합니다.

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

---

## WebSocket 메시지 타입

`WS /ws/issues` 에서 수신하는 메시지 형식입니다.
`type` 필드로 메시지 종류를 구분합니다.

```json
{ "type": "sentiment", "data": { ...SentimentResult } }
{ "type": "briefing",  "data": { ...Briefing } }
{ "type": "spike",     "data": { "wiki_page": "...", "edit_count": 22, "window": "5m" } }
{ "type": "comment",   "data": { ...reddit-comments } }
```

> `type` 필드 값 및 `data` 구조 최종 합의 — 김찬영, 양성호 확인 필요

---

## TBD 목록

| 항목 | 확인 대상 | 시점 |
|---|---|---|
| `edit_count` window 크기, `spike_score` 계산 방식 | 김찬영 | 4주차 |
| `wiki_page` 타입 (URL 전체 vs 슬러그 vs 문서 제목) | 김찬영 | 4주차 |
| Issue `status` 판단 주체 (Kafka Streams vs 서비스팀) | 김찬영 | 4주차 |
| `reddit-comments` 토픽 스키마 확정 (필드, score 필드명 등) | 김찬영 | 4주차 |
| `sentiment` 분류 세분화 여부, `sentiment_score` 정확한 의미 | 양성호 | 4주차 |
| 브리핑 생성 주기, key_points 개수, 중립성 프롬프트 가이드라인 | 양성호 | 4주차 |
| WebSocket 메시지 type/data 구조 최종 합의 | 김찬영, 양성호 | 4주차 |
| Kong JWT 검증 예외 경로 설정 (`GET /issues?preview=true`) | 윤승호 | 5주차 |
| 유저 데이터 영구 저장 DB (PostgreSQL 여부, 온프렘 K8s vs RDS) | 김용균 | 5주차 |
| Keycloak self-registration 허용 여부 | 윤승호 | 5주차 |
