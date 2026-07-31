# Git Integration

Publishing Git operations use fixed command arguments and explicit file paths.

- Status: `git status --porcelain=v1`
- Diff: approved public content files only
- Stage: approved changed files only
- Commit: deterministic default message
- Push: `git push origin <current-branch>`

No force push, reset, checkout restore, credential embedding, or remote URL rewriting is used.
