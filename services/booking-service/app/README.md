# TTP Booking Service (Node.js)

Express 5 + PostgreSQL (`pg`), 4 layers: presentation -> application -> domain, with
infrastructure injected from `src/container.js`.

```
cp .env.example .env
npm install
npm start
```
Endpoints: `GET /health`, `POST /bookings`, `GET /bookings`, `PATCH /bookings/:booking_id/status`
(all `/bookings` routes need `Authorization: Bearer <JWT issued by the auth service>`).
