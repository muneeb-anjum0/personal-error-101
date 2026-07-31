# Development

Install dependencies with:

```bash
pnpm install
```

Run all apps:

```bash
pnpm dev
```

Run one app:

```bash
pnpm dev:portfolio
pnpm dev:generator
```

Quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Phase 0 should stay small. Avoid large files, duplicated schemas, circular imports, and business logic inside JSX.

Phase 1 portfolio development stays static-data only. Run `pnpm dev:portfolio` to work on the public site without starting the generator API.
