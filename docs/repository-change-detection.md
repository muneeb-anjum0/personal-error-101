# Repository Change Detection

Repositories are keyed by stable GitHub repository ID. Renames and transfers preserve selection state and record previous full names.

Change states come from latest commit SHA, README SHA/hash, visibility, archive state, and normalized snapshot hashes. Sync timestamps alone do not create source-change events.

If a repository is absent from a complete sync, the previous snapshot is preserved, the repository is marked no longer accessible, and future processing selection is disabled.
