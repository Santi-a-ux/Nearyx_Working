# TTP API Gateway (Node.js)

Reverse proxy in front of the microservices. No framework magic: Express only serves `/health` and CORS,
everything else is streamed with `node:http` (HTTP) or tunneled byte-for-byte (WebSocket upgrades).

```
cp .env.example .env
npm install
npm start
```

Routing is by first path segment and the full path is forwarded unchanged
(`/auth/login` -> `auth-service/auth/login`):

| Segment | Service | Port |
|---|---|---|
| auth | auth-service | 8001 |
| users | user-service | 8002 |
| tutors | tutor-service | 8003 |
| geo | geo-service | 8004 |
| chat | chat-service | 8005 |
| media | media-service | 8006 |
| bookings | booking-service | 8007 |

Errors: unknown service `404 {"detail":"Service not found"}`, upstream down `502`, upstream timeout `504`.
