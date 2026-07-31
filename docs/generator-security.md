# Generator Security

The generator is authentication-free and intended only for local use.

Safeguards include restricted CORS, local access checks, normalized request IDs, capped request bodies, safe error responses, settings writes constrained to the data directory, explicit content file allowlists, fixed `git --version` and `docker --version` checks, and secret redaction.

GitHub safeguards: `GITHUB_TOKEN` is server-environment only, never persisted, never logged, never returned to the UI, and never included in API docs. The GitHub client uses only `https://api.github.com`, keeps TLS verification enabled, caps README storage at 1 MB, avoids raw HTML execution in previews, prevents concurrent sync runs, and validates all mutation bodies.

AI safeguards: local AI base URLs are restricted to `127.0.0.1`, `localhost`, and `host.docker.internal`; managed process startup uses argument arrays instead of shell strings; Docker mode marks Windows process management unavailable; README content is treated as untrusted data; raw AI responses and drafts stay under ignored `data/ai/`.

This is not a public-exposure security model. Do not expose the generator API to the internet.
