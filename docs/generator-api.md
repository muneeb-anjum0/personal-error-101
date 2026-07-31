# Generator API

Local API base URL: `http://localhost:4000`.

Core endpoints: `GET /health`, `GET /ready`, `GET /api/version`, `GET /api/dashboard`, `GET /api/content/status`, `GET /api/content/:type`, `GET /api/settings`, `PUT /api/settings`, `GET /api/logs`, `GET /api/system`, and `GET /api/docs`.

GitHub endpoints: `GET /api/github/status`, `GET /api/github/rate-limit`, `GET /api/github/repositories`, `GET /api/github/repositories/:repositoryId`, `POST /api/github/sync`, `POST /api/github/sync/full`, `POST /api/github/sync/cancel`, `GET /api/github/sync/status`, `PUT /api/github/selections/:repositoryId`, `POST /api/github/selections/bulk`, and `PUT /api/github/repositories/:repositoryId/notes`.

AI endpoints: `GET /api/ai/runtime`, `POST /api/ai/check`, `POST /api/ai/start`, `POST /api/ai/stop`, `POST /api/ai/warm-up`, and `POST /api/ai/test-generation`.

Queue and draft endpoints: `GET /api/queue`, `POST /api/queue/enqueue`, `POST /api/queue/start`, `POST /api/queue/pause`, `POST /api/queue/resume`, `POST /api/queue/jobs/:jobId/cancel`, `POST /api/queue/jobs/:jobId/retry`, `POST /api/queue/retry-failed`, `GET /api/drafts`, and `GET /api/drafts/:draftId`.

Supported content types: `profile`, `projects`, `experience`, `skills`, `activity`, and `generator-state`.

Errors use the shared contract with `code`, `message`, `requestId`, `details`, and `timestamp`.

Tokens are never accepted in request bodies. Repository queries are validated, paginated, and capped at 100 records per response.
