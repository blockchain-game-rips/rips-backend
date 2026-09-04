# ADR-0002: Card rewards are a pure function of chain data

- Status: Accepted
- Date: 2026-09-02

## Context and Problem Statement

Money payouts came from Chainlink VRF: `resolvePayout` derived `payoutNumber`
from the pair `(a, b)`, deterministically and checkably. The card draw did not.
`resolveRandomCard` called `Math.random()`, and read the collection and the bias
as they stood at the moment of settlement — after the outcome was already known.

Irreproducibility was not only `Math.random()`. Three inputs to the draw
depended on *when* the backend processed a rip rather than on what happened
on chain:

1. `k`, the number of unique cards the player held in the tier, was read from
   `EntryPayout` at settlement time. A rip settled a month late saw a different
   user collection than it would have seen immediately.
2. Rip order. Rips finish out of id order, and processing order was whatever
   the worker happened to reach first.
3. The collection and the bias. Neither was pinned to a rip: the collection came
   from the database at settlement time, the bias from yaml at process start.

While cards are cosmetic this costs nothing. But the boost already affects what
a player receives, and if cards ever acquire value, an unverifiable award
becomes a real problem.

## Decision

Card assignment becomes a pure function of chain data.

**Entropy from VRF.** `Math.random()` is replaced by a keccak256 hash over a
domain separator and an ordering key:

```
entropy = hash("rips.card.v1", a, b, settleBlockNumber, settleLogIndex, entryNumber)
```

The settlement key is in the hash not for entropy but so that ordering and draw
cannot drift apart: removing the key from the computation without changing the
signature becomes impossible. It also identifies the rip uniquely, so no
separate rip id is needed.

**Order from chain.** The indexer records the block number and log index of
`RandomnessFulfilled` — the single event where a rip receives `(a, b)` and moves
to `CLAIMING`. The position is immutable and monotonic.

The randoms and that position are one thing, not two: both arrive with that
event, and neither is ever present without the other. `RandomnessFulfillment`
carries them together, so "has randoms but no order" cannot be expressed. The
repositories, which only ever sort by it, take the narrower `SettlementKey`.

**`k` by key, not by time.** `k` counts cards from rips whose settlement key is
strictly smaller than the current one, plus cards already awarded to the same
player earlier within the current rip. Entries inside a rip are processed in
ascending `entryNumber`.

**The draw rules are fingerprinted.** Which cards exist and how strongly each
tier boosts a missing card are the two inputs a recomputation cannot recover on
its own. Both are rendered into one readable string — `cards=1,2,3|...;biases=2,1,0`
— written onto the rip and re-checked at every settlement, so changing either
fails loudly instead of quietly handing out different cards.

The cards come from `card_definitions`, the single place they are defined; the
fingerprint describes what the draw actually used rather than a second list kept
alongside it. Card ids are explicit rather than autoincrement, so the seed's
execution order cannot influence a draw.

The bias is a function of the tier, not a table: it falls off linearly from the
most common tier to none at all in the rarest, so the backend never has to know
how many tiers or presets production runs. The fingerprint records the biases as
computed, so changing the formula is caught the same way changing a card is.

A readable string, not a hash: it is only ever compared for equality, and when
it differs the error should say what changed.

**Integer arithmetic throughout.** `Math.random() * totalWeight` produced a
float, and reproducibility would have hinged on rounding. Weights are integers,
the choice is the entropy modulo the weight sum, and the boost defers its
division by `n` to the end.

## Consequences

- A rip settled late produces exactly the result it would have produced
  immediately, and a hole no longer blocks settlement of later rips.
- The backend database can be dropped and every card re-awarded from scratch
  with an identical result.
- `resolveSyncProgress` and the fulfillment position answer different questions
  and must not be conflated: traversal is still by rip id, the computation is by
  position.
- Adding a card or changing a bias breaks settlement by design. Neither is
  supported yet; supporting them means deciding then how already-awarded
  collections carry over.
- Reproducibility is not the same as external verifiability: no public endpoint
  lets a user recompute their own card yet.
