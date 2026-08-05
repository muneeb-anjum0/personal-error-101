# Safe Publishing

Phase 7 publishes approved local content without Vercel automation.

Workflow:

1. Select a prepared bundle.
2. Run preflight against the current public baseline.
3. Review structured and Git diffs.
4. Create a public-content backup.
5. Confirm `APPLY APPROVED CONTENT LOCALLY`.
6. Validate schemas and build/test the portfolio.
7. Review Git status and diff.
8. Confirm commit and push separately.

Only `data/profile.json`, `data/projects.json`, `data/experience.json`, and `data/skills.json` may be written.
