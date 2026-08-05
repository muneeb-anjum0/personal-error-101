# MUNEEB.SYSTEMS

A monorepo containing a public engineering portfolio and a private, local content generator.

## Repository map

```text
apps/
├── portfolio/          Public Next.js portfolio
└── generator/
    ├── ui/             Local React admin interface
    └── server/         Local Fastify API and AI queue

packages/
├── content-engine/     JSON content loading and validation
├── shared-config/      Shared TypeScript configuration
├── shared-schemas/     Runtime schemas
└── shared-types/       Shared domain types

data/                   Public JSON plus ignored local runtime state
docker/                 Dockerfiles for each application
docs/                   Architecture, operations, and development guides
tests/e2e/              Cross-application Playwright tests
```

Root files are limited to workspace configuration and deployment entry points.

## Local development

```bash
pnpm install
docker compose up -d
```

| Service           | Address                 | Exposure           |
| ----------------- | ----------------------- | ------------------ |
| Portfolio preview | `http://localhost:3000` | Local/LAN preview  |
| Generator UI      | `http://localhost:4173` | This computer only |
| Generator API     | `http://localhost:4000` | This computer only |
| Local AI runtime  | `http://localhost:8080` | This computer only |

## Publish the portfolio

```bash
pnpm deploy:portfolio:firebase
```

Live site: [muneeb-anjum.web.app](https://muneeb-anjum.web.app)

See [docs/deployment.md](docs/deployment.md) for the complete workflow and
[docs/README.md](docs/README.md) for documentation navigation.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
