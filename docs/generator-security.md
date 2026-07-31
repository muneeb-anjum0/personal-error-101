# Generator Security

The generator is authentication-free and intended only for local use.

Safeguards include restricted CORS, local access checks, normalized request IDs, capped request bodies, safe error responses, settings writes constrained to the data directory, explicit content file allowlists, fixed `git --version` and `docker --version` checks, and secret redaction.

This is not a public-exposure security model. Do not expose the generator API to the internet.
