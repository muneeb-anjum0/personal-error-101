# GitHub Token Setup

GitHub uses a **GitHub Personal Access Token** for this workflow, not a generic API key.

Create it in GitHub through Profile picture, Settings, Developer settings, Personal access tokens, Fine-grained tokens, Generate new token.

Recommended settings:

- Token name: `MUNEEB.SYSTEMS Local Generator`
- Repository access: `Only select repositories` when possible
- Minimum repository permissions: `Contents: Read-only`, `Metadata: Read-only`
- Copy the token immediately; GitHub may show it only once

Store it locally, never in the repository:

```env
GITHUB_USERNAME=muneeb-anjum0
GITHUB_TOKEN=github_pat_REPLACE_WITH_YOUR_TOKEN
GITHUB_INCLUDE_PRIVATE=true
```

Preferred file: `apps/generator/server/.env.local`, or set it in a PowerShell session:

```powershell
$env:GITHUB_USERNAME="muneeb-anjum0"
$env:GITHUB_TOKEN="github_pat_REPLACE_WITH_YOUR_TOKEN"
$env:GITHUB_INCLUDE_PRIVATE="true"
```

Restart:

```powershell
docker compose down
docker compose up -d --build
```

Git push authentication is separate and may use Git Credential Manager, GitHub CLI, SSH, or HTTPS credentials.
