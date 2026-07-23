# ADR-0001: Domain `Currency` interface vs. `EvmCurrency` `instanceof` checks

- Status: Proposed
- Date: 2026-07-23

## Context and Problem Statement

The domain exposes a plain `Currency` interface (`{ id, chainAddress } & CurrencyMetadata`).
It deliberately knows nothing about EVM sub-kinds — a currency is just something with
a chain, an address, and metadata.

However, several infrastructure services branch on concrete `EvmCurrency` subclasses via
`instanceof` (`Token`, `NativeCurrency`, `WrappedNative`):

- `infrastructure/wallet/wallet-write.service.ts` — `instanceof EvmCurrency`
- `infrastructure/wallet/wallet-read.service.ts` — `instanceof EvmCurrency`
- `infrastructure/evm/evm-currency-read.service.ts` — `instanceof Token`
- `infrastructure/evm/evm-currency.service.ts` — `instanceof WrappedNative`
- `infrastructure/evm/evm-currency-write.service.ts` — `instanceof NativeCurrency`, `instanceof Token`
- `infrastructure/de-bridge/de-bridge.service.ts` — `instanceof Token`

The tension: any object that satisfies the `Currency` interface type-checks as a valid
`Currency`, but if it is not an actual `EvmCurrency` instance it will silently fail the
`instanceof` branches at runtime. The interface advertises a contract the services do not
actually accept.

Concrete trigger: building a currency catalog endpoint (`GET /currencies/supported`) tempts
us to project plain `Currency` objects from the currency registry. Those would be valid
`Currency` values but not `EvmCurrency` instances, so they must never flow into the services
above. Today the only safe way to obtain a currency that satisfies those checks is
`EvmCurrencyService.fromAddress`, which also maintains a shared-instance cache
(`Map<CurrencyId, EvmCurrency>`).

## Forces in tension

- Domain `Currency` should stay dumb — native/token/wrapped is an EVM concern, not domain
  taxonomy. Pushing a discriminant onto the domain type leaks infrastructure upward.
- Application code orchestrates in domain types, yet some operations genuinely need EVM
  behavior only infrastructure can provide.
- `instanceof` on class identity is structural branching disguised as a type check; it makes
  the `Currency` interface unsound in practice.
- Only `EvmCurrencyService` should mint EVM currencies (cache / identity invariant), but the
  plain interface invites hand-construction.

## Options (not yet decided)

1. **Resolve at the boundary** — application passes identifiers (`CurrencyId` / `ChainAddress`);
   an infra port resolves to real `EvmCurrency` internally. Nothing hand-built reaches an
   `instanceof`.
2. **Push behavior onto the port** — the decisions the `instanceof` branches make become
   methods on infra services keyed by `Currency`; branching happens inside infra where
   sub-kinds are known.
3. **Tighten signatures** — change the affected service signatures from `Currency` to
   `EvmCurrency` so the type system rejects any plain `Currency` at those call sites.

## Decision

None yet. Documented to solve later.

## Consequences

Until resolved: do not project plain `Currency` objects into any path that reaches the
`instanceof`-dependent services. Obtain currencies via `EvmCurrencyService.fromAddress`.
