# GitHub Integration

Phase 4 uses the official GitHub REST API. Anonymous mode fetches public repositories for `GITHUB_USERNAME`; token mode uses server-side `GITHUB_TOKEN` and may include private repositories only when `GITHUB_INCLUDE_PRIVATE=true` and the token has sufficient access.

The UI displays only `TOKEN CONFIGURED` or `TOKEN NOT CONFIGURED`. The token never enters Vite, shared browser config, persisted JSON, logs, diagnostics, or API responses.

Local state lives in `data/github/`: `repositories.json`, `sync-state.json`, `selections.json`, plus backups. Public portfolio JSON is not modified in this phase.
