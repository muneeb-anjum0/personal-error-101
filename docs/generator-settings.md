# Generator Settings

Settings live in `data/generator-settings.json` with schema version `1`.

Precedence: environment variables, persisted safe local settings, then application defaults. Secrets such as GitHub tokens and AI API keys remain environment variables and are never persisted.

Writes validate input, serialize deterministic JSON, write a temporary file, back up the previous settings file, rename the temporary file, and retain up to 10 backups in `data/backups/generator-settings`.
