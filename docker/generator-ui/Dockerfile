FROM node:24-slim AS deps
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS builder
RUN pnpm build:packages
RUN pnpm --filter @muneeb-systems/generator-ui build

FROM node:24-slim AS runner
WORKDIR /workspace
ENV NODE_ENV=production
RUN corepack enable
COPY --from=builder /workspace /workspace
EXPOSE 4173
CMD ["pnpm", "--filter", "@muneeb-systems/generator-ui", "preview"]
