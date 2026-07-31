# Architecture

Phase 0 creates a monorepo with strict boundaries between public presentation, private generation tooling, shared contracts, content loading, and future infrastructure adapters.

## Applications

`apps/portfolio` is the public deployable frontend. It must remain functional without the generator backend and only reads committed static JSON content.

`apps/generator/server` is the private local API. It owns future orchestration for GitHub, local AI, filesystem persistence, queueing, Git operations, and publishing.

`apps/generator/ui` is the private management interface. In Phase 0 it only displays API health and placeholder readiness.

## Shared Packages

Shared schemas live in `packages/shared-schemas`. Types are inferred in `packages/shared-types` so applications do not duplicate contract definitions. `packages/content-engine` owns JSON loading and validation.

## Future Boundaries

Future GitHub, AI, queue, process, filesystem, and publishing code should be added under the generator server infrastructure layer behind domain-facing interfaces.
