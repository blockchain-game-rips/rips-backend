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
