# wikipulse-service

🚀 AI-Driven Real-time Issue Monitoring System

이 프로젝트는 FastAPI와 Next.js 14를 기반으로 한 실시간 이슈 모니터링 및 알림 시스템입니다. 1주차에는 프로젝트의 핵심 아키텍처 설계와 Mock 데이터를 활용한 전체 파이프라인 검증(PoC)을 완료했습니다.
🛠 Tech Stack
분류 기술 스택
Frontend Next.js 14 (App Router), TypeScript, Tailwind CSS
Backend FastAPI, Poetry, Pydantic v2, Python-jose
Real-time WebSocket, Redis, AIoKafka
Auth Next-Auth, Keycloak (Ready)
DevOps Docker, Docker Compose
📂 Project Structure
🔹 Backend (/backend)

    app/main.py: FastAPI 앱 설정, CORS 및 헬스체크(/health) 엔드포인트.

    app/core/: config.py(Pydantic-settings) 및 auth.py(JWT/JWKS 로직).

    app/api/: 기능별 라우터(Issues, Alerts, WebSocket).

    app/services/: Redis, Kafka Consumer, 외부 서비스 연동 로직.

    app/schemas/: 데이터 유효성 검사를 위한 Pydantic 모델.

🔹 Frontend (/frontend)

    app/login/: Keycloak 연동 로그인 페이지.

    app/issues/: 이슈 리스트 및 상세 대시보드.

    hooks/useWebSocket.ts: 3초 자동 재연결 기능이 포함된 실시간 통신 훅.

    lib/api.ts: 타입 안정성이 보장된 fetch wrapper.

⚙️ Key Features (Week 1)

    Mock Mode Support: USE_MOCK=true 설정을 통해 Kafka나 Keycloak 없이도 전체 기능 테스트 가능.

    Real-time Streaming: WebSocket을 통한 실시간 알림 및 데이터 업데이트.

    Scalable Architecture: 2주차 Keycloak 및 실전 인프라 전환을 고려한 인터페이스 분리.

    Containerization: Docker Compose를 통한 원클릭 개발 환경 구축.

🚀 Getting Started

1. Environment Setup

각 디렉토리에 환경 변수 파일을 생성합니다.
Bash

cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local

2. Running with Docker (Recommended)
   Bash

docker compose up --build

3. Local Development

Backend:
Bash

cd backend
poetry install
uvicorn app.main:app --reload

# Access at: http://localhost:8000/health

Frontend:
Bash

cd frontend
npm install
npm run dev

# Access at: http://localhost:3000/login

📅 Roadmap

    [x] Week 1: 아키텍처 설계, Mock 기반 데이터 스트리밍, UI 뼈대 구축.

    [ ] Week 2: Keycloak을 활용한 인증 서버 통합 및 실제 Kafka 토픽 연동.

    [ ] Week 3: AI 모델 연동 및 데이터 분석 결과 시각화 고도화.
