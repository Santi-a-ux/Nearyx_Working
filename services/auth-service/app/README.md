# TTP Auth Service (Node.js)

Express 5 + PostgreSQL (`pg`), organized in 4 layers:

```
src/
  presentation/    routes, controllers, middlewares, zod schemas, DTOs (HTTP only)
  application/     AuthService (use cases)
  domain/          entities (User, RefreshToken), roles, domain errors
  infrastructure/  pg pool, schema init, repositories, bcrypt + JWT adapters
  container.js     composition root (dependency injection)
  app.js / server.js
```

Dependencies point inward: presentation -> application -> domain; infrastructure implements
what the application layer needs and is injected in `container.js`.

## Run
```
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npm start              # or: npm run dev
```
Requires Node 20+. Tables are created on startup (`CREATE ... IF NOT EXISTS`), like `create_all`.

## Endpoints (unchanged)
`GET /health`, `POST /auth/register|login|refresh|logout|verify-token`,
`GET /auth/me|ws-token`, `PUT /auth/promote-to-tutor`

## Generate test tokens
```
npm run generate-tokens
```
Prints a tutor access token for the seeded test users (port of `generate_tokens.py`).
Uses `JWT_SECRET` / `JWT_ALGORITHM` / `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`; no database needed.
