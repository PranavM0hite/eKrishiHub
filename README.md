# eKrishiHub (Monorepo)

## Structure
- `frontend/` — Vite + React
- `backend/`  — Spring Boot

## Setup

### Frontend
1. Copy `frontend/.env.example` → `frontend/.env` and fill values.
2. `cd frontend && npm i`
3. `npm run dev` (default http://localhost:5173)

### Backend
1. Create MySQL DB: `e_krishi_hub`
2. Copy `backend/src/main/resources/application-example.properties` → `application.properties` and fill values.
3. `cd backend && mvn spring-boot:run` (default http://localhost:8080)
