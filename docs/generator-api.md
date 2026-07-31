# Generator API

Local API base URL: `http://localhost:4000`.

Endpoints: `GET /health`, `GET /ready`, `GET /api/version`, `GET /api/dashboard`, `GET /api/content/status`, `GET /api/content/:type`, `GET /api/settings`, `PUT /api/settings`, `GET /api/logs`, `GET /api/system`, and `GET /api/docs`.

GitHub endpoints: `GET /api/github/status`, `GET /api/github/rate-limit`, `GET /api/github/repositories`, `GET /api/github/repositories/:repositoryId`, `POST /api/github/sync`, `POST /api/github/sync/full`, `POST /api/github/sync/cancel`, `GET /api/github/sync/status`, `PUT /api/github/selections/:repositoryId`, `POST /api/github/selections/bulk`, and `PUT /api/github/repositories/:repositoryId/notes`.

Supported content types: `profile`, `projects`, `experience`, `skills`, `activity`, and `generator-state`.

Errors use the shared contract with `code`, `message`, `requestId`, `details`, and `timestamp`.

Tokens are never accepted in request bodies. Repository queries are validated, paginated, and capped at 100 records per response.
