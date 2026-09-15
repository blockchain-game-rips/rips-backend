# Context

Glossary of domain terms. Definitions only — no implementation detail.

## Initial setup

The procedure that takes a deployed system from "running" to "ready to accept
users". Its steps establish state that no migration and no startup path creates.

Distinct from *bootstrap*, which is the application starting, and from
*configuration*, which the running service reads. An input to initial setup is
consumed once and never read again.

Made of two kinds of step: seeding and provisioning.

## Seeding

An initial setup step that fills in known content, authored elsewhere and
applied as-is. Cheap to repeat and cheap to undo.

## Provisioning

An initial setup step that creates resources or causes effects outside the
system. Not reliably undoable, and its result is not confined to the database.

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

## Collection

Every card that exists in the game, grouped by tier. A fixed, game-wide set —
the same for every player. Its size per tier is what the reward boost divides
by.

Never say "pool" or "card set" for this. The collection is the whole catalogue;
what a specific player holds is a *user collection*.

## User collection

The cards one player has been awarded, counted per card. Derived from that
player's entry payouts, not stored as its own thing.

The distinction that matters for card rewards is *unique* cards held within a
tier: a player who owns three copies of one card still holds one unique card.
That count is what drives the boost — the fewer unique cards a player holds in
a tier, the likelier an unseen one becomes.

A user collection is scoped to an EVM address. Two addresses are two players,
even behind one Telegram account.
