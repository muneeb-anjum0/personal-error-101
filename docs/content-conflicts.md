# Content Conflicts

Content conflict reporting is tracked in staged content status.

- `GET /api/staged/status` reports staged counts and conflicts.
- Duplicate project slugs are blocked during review validation unless explicitly acknowledged.
- Public baseline files are read as inputs and are not rewritten by staged edits.
