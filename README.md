# ScrapHappens

Basic monorepo starter for **ScarfHappens** with:

- React frontend (`apps/frontend`)
- Node.js backend (`apps/backend`)
- Neon PostgreSQL integration
- JWT authentication with roles: `supplier`, `buyer`, `volunteer`
- AI-ready backend module scaffold

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Configure env:

- copy `apps/backend/.env.example` to `apps/backend/.env`
- fill in Neon and JWT values

3. Run both apps:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Backend API (initial)

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT required)
- `GET /api/protected/supplier-only` (role: supplier)
- `GET /api/protected/buyer-only` (role: buyer)
- `GET /api/protected/volunteer-only` (role: volunteer)
- `POST /api/ai/suggest` (JWT required, AI placeholder)
