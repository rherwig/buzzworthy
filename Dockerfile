# syntax=docker/dockerfile:1

# Buzzworthy runs as a single long-lived Node process: the room registry lives in memory
# and players hold WebSocket connections, so this image is meant to run as exactly ONE
# instance (see docs/DEPLOY.md).

# ---------------------------------------------------------------------------- build
FROM node:22-slim AS builder

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"

# openssl: required by the Prisma query engine.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /app

# Dependencies first so the layer is cached across source-only changes. Lifecycle
# scripts are skipped here because `postinstall` needs the full project.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Never touched at build time; Prisma only needs the variable to exist.
ENV DATABASE_URL="file:/tmp/build.db"

RUN pnpm exec prisma generate \
    && pnpm build

# -------------------------------------------------------------------------- runtime
FROM node:22-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV="production" \
    HOST="0.0.0.0" \
    PORT="3000" \
    DATABASE_URL="file:/data/buzzworthy.db"

# The Nitro output is self-contained; `prisma/` is kept so migrations and the board
# seed can be run against the mounted volume, and `shared/` because the seed data imports
# CLUE_VALUES from there (the single source of the clue-value grid).
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/shared ./shared

# Only what the entrypoint needs, rather than the whole dev tree: the Prisma CLI
# (`migrate deploy`), tsx (runs the TypeScript seed) and zod (imported transitively by
# the seed's board data). The server itself needs none of this — `.output` is bundled.
# Keep these versions in sync with package.json.
RUN npm install --no-save --no-audit --no-fund \
    prisma@6.2.1 \
    @prisma/client@6.2.1 \
    tsx@4.23.13 \
    zod@3.24.1 \
    && npx prisma generate \
    && npm cache clean --force

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
