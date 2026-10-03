# TTP Geo Service (Node.js)

Express 5, 4 layers: presentation -> application -> domain, with infrastructure
(Nominatim client, JWT verifier) injected from `src/container.js`. No database.

```
cp .env.example .env
npm install
npm start
```

Endpoints: `GET /health`, `GET /geo/geocode?q=...`, `GET /geo/reverse-geocode?lat=..&lng=..`

Set `REQUIRE_AUTH=true` to require `Authorization: Bearer <JWT>` on the `/geo` routes
(the JWT_SECRET must then match the auth service's).
