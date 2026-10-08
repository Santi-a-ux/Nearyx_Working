# TTP Media Service (Node.js)

Express 5 + PostgreSQL (`pg`), 4 layers: presentation -> application -> domain, with
infrastructure injected from `src/container.js`. Files go to Supabase Storage (REST via `fetch`).

```
cp .env.example .env
npm install
npm start
```

All routes live under `/media` (plus `GET /health`):

- Publications: `GET /media/posts?limit&offset` (public), `POST /media/posts`, `GET /media/posts/:id` (public),
  `PUT /media/posts/:id`, `DELETE /media/posts/:id` (author only; deleting a post also deletes its comments).
- Comments: `GET /media/posts/:post_id/comments` (public), `POST /media/posts/:post_id/comments`,
  `DELETE /media/posts/:post_id/comments/:comment_id` (author only).
- Files: `POST /media/upload` (multipart: `file` + `type` in avatar|post|document, max 25 MB),
  `GET /media/files/<bucket path>` (redirects to the public URL), `GET /media/:file_id` (metadata, public),
  `DELETE /media/:file_id` (owner only).

Everything not marked public needs `Authorization: Bearer <JWT issued by the auth service>`.
