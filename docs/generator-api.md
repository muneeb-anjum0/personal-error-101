# Generator API

Local API base URL: `http://localhost:4000`.

Core endpoints: `GET /health`, `GET /ready`, `GET /api/version`, `GET /api/dashboard`, `GET /api/content/status`, `GET /api/content/:type`, `GET /api/settings`, `PUT /api/settings`, `GET /api/logs`, `GET /api/system`, and `GET /api/docs`.

GitHub endpoints: `GET /api/github/status`, `GET /api/github/rate-limit`, `GET /api/github/repositories`, `GET /api/github/repositories/:repositoryId`, `POST /api/github/sync`, `POST /api/github/sync/full`, `POST /api/github/sync/cancel`, `GET /api/github/sync/status`, `PUT /api/github/selections/:repositoryId`, `POST /api/github/selections/bulk`, and `PUT /api/github/repositories/:repositoryId/notes`.

AI endpoints: `GET /api/ai/runtime`, `POST /api/ai/check`, `POST /api/ai/start`, `POST /api/ai/stop`, `POST /api/ai/warm-up`, and `POST /api/ai/test-generation`.

Queue and draft endpoints: `GET /api/queue`, `POST /api/queue/enqueue`, `POST /api/queue/start`, `POST /api/queue/pause`, `POST /api/queue/resume`, `POST /api/queue/jobs/:jobId/cancel`, `POST /api/queue/jobs/:jobId/retry`, `POST /api/queue/retry-failed`, `GET /api/drafts`, and `GET /api/drafts/:draftId`.

Publishing endpoints: `GET /api/publishing/execution/status`, `GET /api/publishing/runs`, `POST /api/publishing/runs`, `POST /api/publishing/runs/:runId/preflight`, `GET /api/publishing/runs/:runId/diff`, `POST /api/publishing/runs/:runId/backup`, `POST /api/publishing/runs/:runId/apply`, `POST /api/publishing/runs/:runId/validate`, `POST /api/publishing/runs/:runId/build`, `GET /api/publishing/runs/:runId/git-diff`, `POST /api/publishing/runs/:runId/commit`, `POST /api/publishing/runs/:runId/push`, `POST /api/publishing/runs/:runId/rollback`, `GET /api/publishing/backups`, `GET /api/publishing/git/readiness`, and `POST /api/github/auth/check`.

Supported content types: `profile`, `projects`, `experience`, `skills`, and `generator-state`.

Errors use the shared contract with `code`, `message`, `requestId`, `details`, and `timestamp`.

Tokens are never accepted in request bodies. Repository queries are validated, paginated, and capped at 100 records per response.
