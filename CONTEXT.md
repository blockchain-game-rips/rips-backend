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

## Transaction

A single on-chain transaction, scoped to exactly one chain. Every transaction
has a cost — the gas it burned, denominated in that chain's native currency —
and a sender, the address that paid it.

Cost is intrinsic: a transaction always has one. The open question is never
*whether* there is a cost but *who bore it*, which is what the sender answers.
A cross-chain destination transaction is sent by a third-party solver, not by
the user, so its cost is real but not the user's to pay.

## Available preset

A preset a user can enter right now. A preset is available in one of two ways,
never both and never neither:

- **Live** — a rip is filling, so entering joins that rip.
- **Ready** — no rip is filling, so entering creates one from the preset's
  current config.

A preset with neither a filling rip nor a current config is not available at
all, and is never offered.

Note that "live" is narrower than "ongoing": a preset whose only rip is sealed
or claiming is not live, because that rip can no longer be joined.
