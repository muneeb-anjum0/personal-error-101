# Generator Settings

Settings live in `data/generator-settings.json` with schema version `1`.

Precedence: environment variables, persisted safe local settings, then application defaults. Secrets such as GitHub tokens and AI API keys remain environment variables and are never persisted.

GitHub username and include-private preference are safe settings. `GITHUB_TOKEN` must be provided only as a server environment variable. Without a token, public anonymous synchronization still works; with `GITHUB_INCLUDE_PRIVATE=true`, private repositories are requested only when a token is configured and GitHub grants access.

Writes validate input, serialize deterministic JSON, write a temporary file, back up the previous settings file, rename the temporary file, and retain up to 10 backups in `data/backups/generator-settings`.
