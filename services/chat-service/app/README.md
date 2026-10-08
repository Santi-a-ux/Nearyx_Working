# TTP Chat Service (Node.js)

Express 5 + PostgreSQL (`pg`) + Redis pub/sub (`ioredis`) + WebSocket (`ws`), 4 layers:
presentation -> application -> domain, with infrastructure injected from `src/container.js`.

```
cp .env.example .env
npm install
npm start
```

REST (all need `Authorization: Bearer <JWT issued by the auth service>`):
`GET /health`, `POST /chat/conversations`, `GET /chat/conversations`,
`GET /chat/conversations/:conversation_id/messages`, `GET /chat/unread-count`.

WebSocket: `/chat/ws/:user_id?token=<JWT>` (the `token` cookie takes precedence over the query param).
Client frame: `{ "conversation_id": "<uuid>", "content": "text" }` (`receiver_id` is accepted but ignored:
recipients are derived from the conversation participants).
Server frame: `{ "id", "conversation_id", "sender_id", "content", "created_at" }`.
