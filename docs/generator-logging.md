# Generator Logging

The generator writes structured logs to `data/logs/generator.log` and keeps a small in-memory recent-log buffer for the dashboard.

Levels: `DEBUG`, `INFO`, `WARN`, `ERROR`.

Categories: `APPLICATION`, `API`, `FILESYSTEM`, `CONTENT`, `SETTINGS`, `SYSTEM`, `SECURITY`, `GITHUB`, `AI_RUNTIME`, `AI_PROCESS`, `AI_HEALTH`, `AI_GENERATION`, `AI_VALIDATION`, `AI_REPAIR`, `QUEUE`, `QUEUE_RECOVERY`, `DRAFT`, `FUTURE_AI`, and `FUTURE_PUBLISH`.

Phase 5 logs GitHub sync, AI runtime, warm-up, generation, repair, queue transitions, recovery, and private draft persistence. Logs must not include tokens, authorization headers, raw GitHub response bodies, README bodies, prompts, raw AI responses, or private source code.

`GET /api/logs` supports safe filters for level, category, search, limit, before, and order. Limits are capped at 200.
