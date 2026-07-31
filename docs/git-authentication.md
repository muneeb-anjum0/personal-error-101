# Git Authentication

GitHub REST API authentication reads repository metadata and README content through server-side `GITHUB_TOKEN`.

Git push authentication is handled by the local Git client. Supported local mechanisms include Git Credential Manager, GitHub CLI, SSH keys, and HTTPS credentials.

The generator never embeds tokens in remote URLs, Git config, browser storage, API responses, logs, or examples.
