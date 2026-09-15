# rips-backend

Backend service for the RIPS system — a NestJS application integrating EVM smart contracts, PostgreSQL, and cloud KMS providers.

## Overview

- REST API built with [NestJS](https://nestjs.com/)
- PostgreSQL database via [Prisma ORM](https://www.prisma.io/)
- EVM smart contract interaction via [viem](https://viem.sh/)
- Key management via AWS KMS or Google Cloud KMS
- YAML-based configuration with [Zod](https://zod.dev/) schema validation
- Scheduled keeper jobs via `@nestjs/schedule`

## Installation

**Prerequisites**: Node.js, Yarn, PostgreSQL

```bash
yarn install
```

Set up your environment variables:

| Variable       | Description                         |
| -------------- | ----------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string        |
| `CONFIG_PATH`  | Path to YAML config file            |
| `PORT`         | HTTP port (default: `3000`)         |

Run database migrations:

```bash
yarn prisma migrate deploy
```

## Initial setup

Five pieces of state are required before the backend can serve users. No
migration and no startup path creates them:

1. **Admin wallet** — the key the backend signs administrative transactions
   with, encrypted with the KEK and stored in the database.
2. **Executors** — the keypairs the keeper sends transactions from.
3. **Executor roles** — `grantOperatorRole` on the contract, one transaction per
   executor, sent by the admin wallet. Requires step 1.
4. **Card definitions** — the collection every rip draws from.
5. **Eligibility policy** — the singleton row, created together with the terms
   document the gate serves.

All five are applied by one command, which ships in the image:

```bash
node dist/src/setup/setup.js <cards.json> <terms-document>
```

It prompts for:

- **admin private key** — read without echo. Used once, to write the encrypted
  database record; the backend reads the record, never this input.
- **executor count** — defaults to 2 on an empty answer.

The two file arguments are read once. See `ops/README.md` for where to put them
on the deployed host and the exact invocation.

Run it once, by hand, after the first deploy. Nothing enforces this: there is no
re-run guard and no readiness endpoint. The steps tolerate repetition — the
admin wallet upserts, executors top up to the requested count, the eligibility
policy leaves an established row alone. If a run fails part-way, the steps before
the failure have already been applied; finish the rest by hand.

Dropping the database does not undo step 3. Executor roles live on the contract,
so a rebuilt database means new executors and new grants, with the old grants
still in place.

## Running

```bash
# Development (watch mode)
yarn start:dev

# Debug mode
yarn start:debug

# Production (compile first)
yarn build
yarn start:prod
```

## Testing

Tests are split into three suites: `unit`, `integration`, and `e2e`.

Integration and e2e tests require Docker (for PostgreSQL testcontainers) and [Anvil](https://book.getfoundry.sh/anvil/) (EVM simulator).

```bash
# Unit tests
yarn test

# Unit tests in watch mode
yarn test:watch

# Unit tests with coverage
yarn test:cov

# Integration tests
yarn test:integration

# E2E tests
yarn test:e2e

# All tests
yarn test:all
```

### Flaky tests

`test/unit/domain/resolve-random-card.spec.ts` uses probabilistic sampling and may occasionally fail near tolerance boundaries. Re-run to confirm.

## Configuration

The app loads configuration from a YAML file at the path specified by `CONFIG_PATH`. Example:

```yaml
# yaml-language-server: $schema=./config-schema.json

chainClientConfig:
  rpcSettings:
    "8453":
      rpcUrls:
        - https://mainnet.base.org
      disableDefaultRpcUrl: false
```

### Generate config JSON schema

To get IDE validation and autocomplete for your YAML config file, generate a JSON schema:

```bash
yarn gen-config-schema
```

This writes `config/config-schema.json`. Reference it with the `yaml-language-server` comment shown above.

## Code generation

### Prisma client

```bash
yarn prisma generate
```

### GraphQL types

```bash
yarn graphql-codegen
```
