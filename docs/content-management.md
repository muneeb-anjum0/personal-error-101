# Content Management

Phase 6 edits staged content only. Public `data/*.json` files stay unchanged during ordinary editing.

- Staged profile, projects, experience, and skills are managed through `/api/staged`.
- The generator UI exposes one editor page per content type.
- Validation uses the shared content schemas before writing staged files.
