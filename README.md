# muneeb-systems

Responsive static portfolio for **MUNEEB.SYSTEMS** with premium motion, static JSON content, and a local generator dashboard with GitHub repository discovery.

```bash
pnpm install
pnpm dev:portfolio
```

Portfolio: `http://localhost:3000`
Generator UI: `http://localhost:4173`
Generator API: `http://localhost:4000`
API docs: `http://localhost:4000/api/docs`

GitHub sync supports public anonymous mode and optional private discovery with server-side `GITHUB_TOKEN`. Phase 4 stores snapshots in `data/github/` and never mutates public portfolio content.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
