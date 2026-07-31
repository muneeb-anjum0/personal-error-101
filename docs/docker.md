# Docker

Phase 0 includes Dockerfiles for:

- Portfolio
- Generator API
- Generator UI

Build and start:

```bash
pnpm docker:build
pnpm docker:up
```

Stop:

```bash
pnpm docker:down
```

Docker Compose exposes:

- `3000`: portfolio
- `4000`: generator API
- `4173`: generator UI

The compose file mounts `data/` and `assets/`, includes health checks, and supports `host.docker.internal`. The local AI model server is not started in Phase 0.
