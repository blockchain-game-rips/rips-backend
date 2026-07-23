# Context

Glossary of domain terms. Definitions only — no implementation detail.

## Currency

Anything that has a chain and an address. Identified by a CAIP-10 `CurrencyId`.
Covers both the chain's native currency and any on-chain fungible asset.

This is the general concept. Use "currency" everywhere a value has a chain and
an address.

## Token

Specifically a non-native ERC-20 inside an EVM chain. A Token is a kind of
Currency — every Token is a Currency, but the native currency is not a Token.

Only use "token" when the thing is genuinely an ERC-20 (e.g. at the
GeckoTerminal boundary, which only ever prices ERC-20s). Do not use "token" as
a synonym for "currency".
