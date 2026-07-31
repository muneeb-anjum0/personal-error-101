FROM node:24-slim AS deps
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS builder
RUN pnpm build:packages
RUN pnpm --filter @muneeb-systems/portfolio build

FROM node:24-slim AS runner
WORKDIR /workspace/apps/portfolio
ENV NODE_ENV=production
COPY --from=builder /workspace /workspace
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]
