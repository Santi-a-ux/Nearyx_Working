# TTP User Service (Node.js)

Express 5 + PostgreSQL (`pg`), 4 layers: presentation -> application -> domain, with
infrastructure injected from `src/container.js`. Avatars go to Supabase Storage (REST via `fetch`).

```
cp .env.example .env
npm install
npm start
```

Endpoints: `GET /health`, `POST /users/profiles`, `GET /users/me`, `GET /users/profiles/me`,
`PUT /users/profiles/me` (creates the profile if missing), `GET /users/profiles/:user_id` (public),
`POST /users/profiles/avatar` (multipart, field `file`, images only, max 10 MB).
All except `GET /users/profiles/:user_id` need `Authorization: Bearer <JWT issued by the auth service>`.
