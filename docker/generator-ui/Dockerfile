FROM node:24-slim AS deps
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS builder
RUN pnpm build:packages
RUN pnpm --filter @muneeb-systems/generator-ui build

FROM node:24-slim AS runner
WORKDIR /workspace/apps/generator/ui
ENV NODE_ENV=production
COPY --from=builder /workspace /workspace
EXPOSE 4173
CMD ["node", "node_modules/vite/bin/vite.js", "preview", "--host", "0.0.0.0", "--port", "4173"]
