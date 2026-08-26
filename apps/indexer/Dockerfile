# Indexer image (multi-stage). Build from the repo root:
#   docker build -f apps/indexer/Dockerfile -t indexer .

# --- builder: full install + compile, discarded from the final image ---
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat linux-headers

COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/ ./.yarn/

# Workspace manifests first, so the install layer caches until deps change.
COPY apps/indexer/package.json apps/indexer/
COPY apps/backend/package.json apps/backend/
COPY packages/abi/package.json packages/abi/
COPY packages/test-harness/package.json packages/test-harness/

RUN yarn install --immutable

COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/indexer/ ./apps/indexer/

RUN yarn workspace @rips/abi run build

# src/abi and src/model/generated are gitignored; `build` regenerates them.
RUN yarn workspace indexer run build

# --- runner: production-only deps + compiled output ---
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat linux-headers

COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/ ./.yarn/

COPY apps/indexer/package.json apps/indexer/
COPY packages/abi/package.json packages/abi/
COPY packages/test-harness/package.json packages/test-harness/

RUN yarn workspaces focus indexer --production

COPY --from=builder /app/packages/abi/dist packages/abi/dist
COPY --from=builder /app/apps/indexer/lib apps/indexer/lib

COPY apps/indexer/db apps/indexer/db
COPY apps/indexer/schema.graphql apps/indexer/

WORKDIR /app/apps/indexer

# TypeORM migrations create the squid schema before the processor starts.
CMD ["sh", "-c", "npx squid-typeorm-migration apply && node lib/main.js"]
