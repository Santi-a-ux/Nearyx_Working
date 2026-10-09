# TTP Tutor Service (Node.js)

Express 5 + PostgreSQL/PostGIS/pgvector (`pg`) + local embeddings (`@huggingface/transformers`, ONNX),
4 layers: presentation -> application -> domain, with infrastructure injected from `src/container.js`.

```
cp .env.example .env
npm install
npm start
```

## Endpoints (`/tutors`, plus `GET /health`)

| Method | Path | Access |
|---|---|---|
| GET | `/recommendations/:user_id` | any authenticated user (2-hop chat/booking graph) |
| POST | `/profiles` | authenticated |
| PUT | `/profiles`, `/availability?is_available=` | role `tutor` |
| GET | `/profiles/me` | role `tutor` |
| GET | `/` (filters: `category`, `q`, `is_available`, `lat`, `lng`, `radius`, `limit`, `offset`) | public |
| GET | `/:user_id` | public |
| GET / PUT | `/:user_id/rating` | authenticated |
| POST | `/verification` | role `tutor` |
| GET | `/verification/me` | role `tutor` |
| GET | `/verification/requests?status=` | role `admin` |
| PATCH | `/verification/requests/:request_id` | role `admin` |
| GET | `/verification/:user_id` | public (approved data only, never documents) |

## Semantic search (`q`)

`q` is embedded as `query: <text>` and compared (cosine distance) with each profile's embedding
(`passage: <specialties, categories>`). A profile is returned only if its distance is < 0.16, within 0.02 of the
best match, and the best match is < 0.12. The model is loaded in the background at startup; until it is
ready, `q` searches wait for it (503 if it cannot be loaded). Creating/updating a profile never fails because of the
model: the embedding stays NULL and `npm run backfill:embeddings` fills it later.

Scripts (replace the old Python ones): `npm run backfill:embeddings`, `npm run debug:search -- "yoga"`,
`npm run verify:embeddings` (compares the embeddings already stored by the Python service with the ones computed here;
run it once after migrating: similarity should be >= 0.99).
