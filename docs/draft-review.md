# Draft Review

Phase 6 keeps generated project drafts private until they are opened in the review workspace.

- Source drafts live under ignored AI storage.
- `POST /api/reviews` opens one draft into an editable review.
- Reopening an existing draft returns the existing review instead of duplicating it.
