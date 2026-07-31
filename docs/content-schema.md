# Content Schema

Static content is stored as JSON in `data/` and validated by Zod schemas from `packages/shared-schemas`.

## Files

- `profile.json`: identity, bio, links, and resume path.
- `experience.json`: editable work and independent engineering entries.
- `skills.json`: skill categories and labels.
- `projects.json`: editable starter project records.
- `activity.json`: development activity items.
- `generator-state.json`: private generator state placeholder.

Invalid JSON or schema failures should stop the build or request with a clear validation error. Future migrations and backups should be added to `packages/content-engine`.

## Phase 1 Additions

Projects may include slugs, categories, technologies, timestamps, case-study fields, and `hidden`. Hidden projects are excluded from public lists and static routes. Projects are sorted by `pushedAt`, then `updatedAt`, then `createdAt`.

Profile content may include configured statistics. Experience entries may include challenge, contributions, results, technologies, and related project ids.
