# Publishing Recovery

Each publishing run persists state under ignored `data/publishing/` storage.

- Backups are created before public content writes.
- Failed multi-file application restores replaced files from backup when possible.
- Rollback requires an action-specific confirmation token.
- Remote Git history is never rolled back automatically.

If an API restart interrupts a run, reopen Publish and inspect the latest run and backup availability.
