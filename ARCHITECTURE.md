# ScarfHappens Architecture (Starter)

## Repository layout

```
apps/
  backend/      # Express API, auth, DB, AI service layer
  frontend/     # React app (Vite)
```

## Backend modules

- `src/config`: environment + constants
- `src/db`: Neon PostgreSQL connection + bootstrap schema
- `src/middleware`: auth/JWT middleware and role guard
- `src/modules/auth`: registration, login, profile endpoint
- `src/modules/protected`: role-based endpoints
- `src/modules/ai`: AI controller + service abstraction
- `src/types`: shared runtime-safe app constants

## Auth model

- JWT access token signed with `JWT_SECRET`
- User roles enforced by middleware:
  - supplier
  - buyer
  - volunteer

## Database model (starter)

- `users`
  - `id` UUID PK
  - `name` text
  - `email` unique text
  - `password_hash` text
  - `role` enum-like text check
  - `created_at` timestamp

## AI integration strategy

- Keep provider logic in `modules/ai/ai.service.js`.
- Current implementation returns a safe placeholder when no provider key is configured.
- Swap in OpenAI/other provider later without changing route contracts.

## Frontend strategy

- Feature-oriented pages with service layer for API calls.
- Auth token stored in memory/localStorage for initial MVP.
- Role-aware rendering can be added using `/api/auth/me` response.
