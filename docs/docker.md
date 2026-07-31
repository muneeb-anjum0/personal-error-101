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

The compose file mounts `data/` and `assets/`, includes health checks, and supports `host.docker.internal`.

Phase 3 persists generator settings and logs through the `./data:/workspace/data` bind mount. The Windows host model path is displayed as configured, but a container cannot inspect it unless a later phase adds an explicit model mount. The local AI model server is still not started.
