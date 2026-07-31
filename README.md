# muneeb-systems

Responsive static portfolio for **MUNEEB.SYSTEMS** plus a private local generator for GitHub sync, AI drafts, review, staged edits, previews, approval bundles, and safe local publishing.

```bash
pnpm install
pnpm dev:portfolio
```

Portfolio: `http://localhost:3000`
Generator UI: `http://localhost:4173`
Generator API: `http://localhost:4000`
API docs: `http://localhost:4000/api/docs`

Private generator state stays ignored under `data/github/`, `data/ai/`, `data/review/`, `data/staged/`, `data/preview/`, and `data/publishing/`. Public `data/*.json` is edited only by intentional manual publish work.

Safe publishing is local-only: no Vercel automation, explicit apply/commit/push confirmations, public-content backups, Git diff review, and rollback support.

Local AI defaults: `LOCAL_AI_MODEL=Qwen3-8B-Q4_K_M`, `LOCAL_AI_MODEL_PATH=D:\Desktop\Model\Qwen3-8B-Q4_K_M.gguf`, `LOCAL_AI_BASE_URL=http://host.docker.internal:8080/v1`.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```
