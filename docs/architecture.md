# Architecture

Phase 0 creates a monorepo with strict boundaries between public presentation, private generation tooling, shared contracts, content loading, and future infrastructure adapters.

## Applications

`apps/portfolio` is the public deployable frontend. It must remain functional without the generator backend and only reads committed static JSON content.

In Phase 1 the portfolio is composed from server-rendered sections, small client components only for interaction, and shared selectors in `apps/portfolio/src/lib/portfolio-selectors.ts`.

Phase 2 keeps that split. Motion is added through focused client islands in `apps/portfolio/src/components/motion`, `apps/portfolio/src/components/cursor`, and the existing interactive section components. The homepage remains server-rendered; browser APIs are limited to providers, SVG animation, navigation state, filters, dialogs, and timeline selectors.

Shared animation constants live in `apps/portfolio/src/lib/animation`. Device and animation budget decisions live in `apps/portfolio/src/lib/performance`.

`apps/generator/server` is the private local API. It owns GitHub discovery, local AI, filesystem persistence, queueing, Git operations, and publishing boundaries. In Phase 5 it exposes local-only dashboard, content inspection, settings, logs, system, readiness, version, docs, GitHub status, repository sync, repository snapshots, selections, notes, AI runtime, queue, and draft endpoints.

`apps/generator/ui` is the private management interface. In Phase 5 it is a routed Vite/React dashboard with Overview, Repositories, Queue, Local AI, Content, Settings, Logs, and System pages plus disabled future navigation for publishing.

## Shared Packages

Shared schemas live in `packages/shared-schemas`. Types are inferred in `packages/shared-types` so applications do not duplicate contract definitions. `packages/content-engine` owns JSON loading and validation.

## Future Boundaries

GitHub, AI, queue, and draft persistence live under the generator server infrastructure/application layers. AI-generated output is private draft data only; review/edit approval, portfolio mutation, Git commit automation, and publishing remain later-phase boundaries.
