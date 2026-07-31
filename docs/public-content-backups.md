# Public Content Backups

Backups are stored under:

```text
data/publishing/backups/<backup-id>/
```

Each backup includes the five approved public JSON files and `manifest.json` with hashes, sizes, branch, baseline commit, validation status, and restore eligibility.

Backups never include credentials, `.git`, environment files, model files, `node_modules`, or unrelated source files.
