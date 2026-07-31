# Generator Logging

The generator writes structured logs to `data/logs/generator.log` and keeps a small in-memory recent-log buffer for the dashboard.

Levels: `DEBUG`, `INFO`, `WARN`, `ERROR`.

Categories: `APPLICATION`, `API`, `FILESYSTEM`, `CONTENT`, `SETTINGS`, `SYSTEM`, `SECURITY`, `FUTURE_GITHUB`, `FUTURE_AI`, and `FUTURE_PUBLISH`.

`GET /api/logs` supports safe filters for level, category, search, limit, before, and order. Limits are capped at 200.
