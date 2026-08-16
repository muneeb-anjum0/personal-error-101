FROM node:24-slim AS deps
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS builder
RUN pnpm build:packages
RUN pnpm --filter @muneeb-systems/generator-server build

FROM node:24-slim AS runner
WORKDIR /workspace/apps/generator/server
ENV NODE_ENV=production
RUN corepack enable \
  && mkdir -p /home/node/.config/configstore \
  && chown -R node:node /home/node/.config
COPY --from=builder --chown=1000:1000 /workspace /workspace
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
