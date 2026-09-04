/**
 * How strongly tier 0 favours a card the player does not own yet. Later tiers
 * fall off linearly to no bias at all in the last one: a common card is worth
 * chasing, a rare one should land on its own odds.
 */
const TOP_TIER_BIAS = 2n

/**
 * Bias for the tier at `tierIndex` of `tierCount`.
 *
 * A function rather than a table: the backend has no business knowing how many
 * tiers a preset defines. The count comes from the cards themselves.
 *
 * Integers, not floats: the draw is all-integer arithmetic, so the fall-off
 * lands on whole steps — across 7 tiers it reads 2, 1, 1, 1, 0, 0, 0.
 */
export function getTierBias(tierIndex: number, tierCount: number): bigint {
	if (tierCount <= 0)
		throw new Error(`Tier count must be positive, got ${tierCount}`)

	if (tierIndex < 0 || tierIndex >= tierCount)
		throw new Error(
			`Tier index ${tierIndex} is outside a collection of ${tierCount} tiers`,
		)

	const lastTierIndex = tierCount - 1

	if (lastTierIndex === 0) return 0n

	const tiersBelowLast = BigInt(lastTierIndex - tierIndex)

	return (TOP_TIER_BIAS * tiersBelowLast) / BigInt(lastTierIndex)
}

export function getTierBiases(tierCount: number): bigint[] {
	if (tierCount <= 0)
		throw new Error(`Tier count must be positive, got ${tierCount}`)

	return Array.from({ length: tierCount }, (_, tierIndex) =>
		getTierBias(tierIndex, tierCount),
	)
}
