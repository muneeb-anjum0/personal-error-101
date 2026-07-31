# Generator API

Local API base URL: `http://localhost:4000`.

Endpoints: `GET /health`, `GET /ready`, `GET /api/version`, `GET /api/dashboard`, `GET /api/content/status`, `GET /api/content/:type`, `GET /api/settings`, `PUT /api/settings`, `GET /api/logs`, `GET /api/system`, and `GET /api/docs`.

Supported content types: `profile`, `projects`, `experience`, `skills`, `activity`, and `generator-state`.

Errors use the shared contract with `code`, `message`, `requestId`, `details`, and `timestamp`.
