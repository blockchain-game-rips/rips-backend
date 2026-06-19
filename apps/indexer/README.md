# Rips Protocol Indexer

A [Subsquid](https://subsquid.io)-based indexer for the Rips Protocol — an EVM game. It processes on-chain events from the Rips smart contract and stores them in a PostgreSQL database, exposing the data through a GraphQL API.

**Indexed data:**
- Preset configurations and payout tiers
- Rip lifecycle (Active → SoldOut → VRFRequested → Finalized)
- Entry purchases, payout claims, and refunds
- VRF randomness requests and finalization
- Protocol configuration changes (fees, recipients, callback gas limits)

## Requirements

- Node.js v20+
- Docker
- Yarn
- [Squid CLI](https://docs.subsquid.io/squid-cli/): `npm i -g @subsquid/cli`

## Install

```bash
yarn
```

## Run

```bash
# start a local Postgres
sqd up

# build and start both the processor and GraphQL server
sqd build
sqd run .
```

The GraphiQL playgrip will be available at [localhost:4350/graphql](http://localhost:4350/graphql).

You can also start services individually:

```bash
sqd process
sqd serve
```

## Configuration

Set the following environment variables (see `.env`):

| Variable | Description |
|---|---|
| `CONTRACT_ADDRESS` | Rips contract address |
| `CONTRACT_DEPLOYED_AT` | Block number the contract was deployed at |
| `RPC_ENDPOINT` | EVM node RPC URL |

## Tests

```bash
# run all tests
yarn test

# run e2e tests only
yarn test:e2e
```

E2E tests spin up a local Anvil chain and a PostgreSQL container via Testcontainers — Docker must be running.
