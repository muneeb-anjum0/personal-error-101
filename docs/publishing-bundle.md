# Publishing Bundle

Publishing bundles prepare approved and staged content for manual release review.

- `POST /api/publishing/bundles` creates a bundle only when approvals exist.
- Bundles include validation state and a diff summary.
- Phase 6 never commits, pushes, deploys, or publishes generated content automatically.
- Phase 7 consumes prepared bundles through safe publishing runs. See `docs/safe-publishing.md`.
