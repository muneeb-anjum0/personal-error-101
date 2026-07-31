# Review Revisions

Manual edits are saved as a working copy first, then checkpointed as immutable review revisions.

- `PUT /api/reviews/:reviewId/working-copy` updates editable content with version checks.
- `POST /api/reviews/:reviewId/revisions` stores a revision.
- `GET /api/reviews/:reviewId/compare` reports field-level changes.
