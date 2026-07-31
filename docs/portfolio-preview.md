# Portfolio Preview

Preview sessions are temporary bundles built from staged content.

- `POST /api/preview/sessions` creates an expiring preview session.
- `GET /api/preview/sessions/:sessionId/data` returns the exact staged bundle for inspection.
- Preview data is private local state, not public portfolio content.
