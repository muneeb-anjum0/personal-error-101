# Repository Synchronization

Full sync fetches repository metadata, README data, language byte counts, topics, default branch, and latest commit SHA. Incremental sync compares lightweight metadata first and skips README/language fetches when unchanged.

Pagination follows GitHub `Link` headers with a bounded repository cap of 500. One sync runs at a time. Cancellation preserves completed results and marks the snapshot `CANCELLED`.

Only a complete repository-list snapshot can mark old repositories as `DELETED_OR_INACCESSIBLE`.
