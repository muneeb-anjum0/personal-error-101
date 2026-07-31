# muneeb-systems

Foundation monorepo for **MUNEEB.SYSTEMS**, a portfolio platform for Muneeb Anjum.

Phase 0 is foundation only. It creates the architecture, contracts, static content validation, local generator API, generator UI shell, Docker support, and testing setup. It does not implement portfolio design, animation, GitHub sync, AI generation, publishing, or content management workflows.

## Architecture

- `apps/portfolio`: public Next.js App Router site. It consumes committed static JSON from `data/` and remains independent from the generator backend.
- `apps/generator/server`: private local Fastify API for future repository sync, AI generation, and publishing workflows.
- `apps/generator/ui`: private local Vite React management UI connected to the generator API.
- `packages/shared-schemas`: Zod schemas for content and API contracts.
- `packages/shared-types`: TypeScript types inferred from the shared schemas.
- `packages/shared-config`: environment validation and shared configuration contracts.
- `packages/content-engine`: typed JSON content loading and validation.
- `data`: committed editable starter content used by the portfolio.

## Prerequisites

- Node.js 24 LTS or newer
- pnpm 11 or newer
- Docker Desktop for Docker workflows

## Installation

```bash
pnpm install
```

Copy `.env.example` to `.env` for local overrides. Do not commit real secrets.

## Development

```bash
pnpm dev
pnpm dev:portfolio
pnpm dev:generator
```

Ports:

- Portfolio: `http://localhost:3000`
- Generator API: `http://localhost:4000`
- Generator UI: `http://localhost:4173`

## Quality

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Docker

```bash
pnpm docker:build
pnpm docker:up
pnpm docker:logs
pnpm docker:down
```

Compose services:

- `portfolio`
- `generator-api`
- `generator-ui`

Docker uses shared `data/` and `assets/` mounts. The local model server is intentionally not started in Phase 0.

## Static Content

Static portfolio content lives in:

- `data/profile.json`
- `data/experience.json`
- `data/skills.json`
- `data/projects.json`
- `data/activity.json`
- `data/generator-state.json`

The portfolio validates this content at startup/build through `@muneeb-systems/content-engine`.

## Roadmap

Future phases can add the animated portfolio, content management, GitHub repository synchronization, local AI project generation, publishing workflows, Docker model services, Vercel deployment, and mobile LAN testing without restructuring the repository.
