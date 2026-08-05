# Deploy the portfolio

The public portfolio is a static Firebase Hosting deployment. The admin UI, API, and AI runtime
remain local.

## Publish current content

From the repository root:

```bash
pnpm deploy:portfolio:firebase
```

This command:

1. reads the current public JSON files from `data/`;
2. builds the portfolio as a static export;
3. generates every public project route;
4. deploys the export to `muneeb-anjum.web.app`.

## Local editing workflow

```bash
docker compose up -d
```

- Admin: `http://localhost:4173`
- Local portfolio preview: `http://localhost:3000`
- Live portfolio: `https://muneeb-anjum.web.app`

The local admin and API are bound to loopback and are not available to other LAN devices.
