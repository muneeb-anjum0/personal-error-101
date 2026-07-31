# muneeb-systems

Responsive static portfolio for **MUNEEB.SYSTEMS** plus a private local generator for GitHub discovery, local AI draft generation, and a persistent one-at-a-time processing queue.

```bash
pnpm install
pnpm dev:portfolio
```

Portfolio: `http://localhost:3000`
Generator UI: `http://localhost:4173`
Generator API: `http://localhost:4000`
API docs: `http://localhost:4000/api/docs`

GitHub sync stores snapshots in `data/github/`. Local AI queue state and private drafts stay in ignored `data/ai/`. Generated drafts never modify public `data/projects.json` until a later review phase.

Local AI defaults: `LOCAL_AI_MODEL=Qwen3-8B-Q4_K_M`, `LOCAL_AI_MODEL_PATH=D:\Desktop\Model\Qwen3-8B-Q4_K_M.gguf`, `LOCAL_AI_BASE_URL=http://host.docker.internal:8080/v1`.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
