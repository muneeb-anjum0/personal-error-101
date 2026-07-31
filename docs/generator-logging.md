# Generator Logging

The generator writes structured logs to `data/logs/generator.log` and keeps a small in-memory recent-log buffer for the dashboard.

Levels: `DEBUG`, `INFO`, `WARN`, `ERROR`.

Categories: `APPLICATION`, `API`, `FILESYSTEM`, `CONTENT`, `SETTINGS`, `SYSTEM`, `SECURITY`, `GITHUB`, `FUTURE_AI`, and `FUTURE_PUBLISH`.

Phase 4 adds `GITHUB` events for sync start, mode, account, authentication mode, repository counts, warnings, cancellation, completion, failure, and selection changes. Logs must not include tokens, authorization headers, raw GitHub response bodies, README bodies, or private source code.

`GET /api/logs` supports safe filters for level, category, search, limit, before, and order. Limits are capped at 200.
