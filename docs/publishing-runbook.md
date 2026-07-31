# Publishing Runbook

Use direct Windows mode for the most reliable Git credential access:

```powershell
pnpm install
pnpm dev:generator
```

Docker mode can apply content and inspect Git, but may not see host Git credentials:

```powershell
docker compose down
docker compose up -d --build
```

Open `http://localhost:4173/publish`, select a ready bundle, run each step, and stop before commit or push if any warning looks unfamiliar.
