# Backend image (multi-stage). Build from the repo root:
#   docker build -f apps/backend/Dockerfile -t backend .

# --- builder: full install + compile, discarded from the final image ---
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat linux-headers

COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/ ./.yarn/

# Workspace manifests first, so the install layer caches until deps change.
COPY apps/backend/package.json apps/backend/
COPY apps/indexer/package.json apps/indexer/
COPY packages/abi/package.json packages/abi/
COPY packages/test-harness/package.json packages/test-harness/

RUN yarn install --immutable

COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

RUN yarn workspace @rips/abi run build

# The generated clients are gitignored, so both are produced here.
RUN yarn workspace backend exec prisma generate
RUN yarn workspace backend exec prisma generate --config prisma.indexer.config.ts

RUN yarn workspace backend run build

# --- runner: runtime deps + compiled output ---
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat linux-headers

COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/ ./.yarn/

COPY apps/backend/package.json apps/backend/
COPY packages/abi/package.json packages/abi/
COPY packages/test-harness/package.json packages/test-harness/

# The Prisma CLI applies the migrations on start, so the runner keeps the full
# dependency tree rather than a production-only install.
RUN yarn workspaces focus backend

COPY --from=builder /app/packages/abi/dist packages/abi/dist
COPY --from=builder /app/apps/backend/dist apps/backend/dist
COPY --from=builder /app/apps/backend/generated apps/backend/generated

# prisma migrate deploy reads the schema and the migration history at runtime.
COPY apps/backend/prisma apps/backend/prisma
COPY apps/backend/prisma.config.ts apps/backend/

WORKDIR /app/apps/backend

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
