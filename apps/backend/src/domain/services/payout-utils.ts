import { Config, PayoutTier } from '../entities/config'
import { RandomnessFulfillment } from '../entities/rip'
import { Card } from '../value-objects/card'
import { CardCollection } from '../value-objects/card-collection'
import { deriveCardEntropy } from './card-entropy'

export function resolvePayout(args: {
	entryNumber: number
	fulfillment: RandomnessFulfillment
	config: Config
	cardCollections: CardCollection[]
	tierBiases: readonly bigint[]
}): {
	card: Card
	payoutAmount: bigint
} {
	const { entryNumber, fulfillment, config, cardCollections, tierBiases } =
		args

	const { a, b } = fulfillment.randoms
	const { entryCap, payoutDistribution } = config

	const n = BigInt(entryCap)
	const payoutNumber = ((a * BigInt(entryNumber) + b) % n) + 1n

	const { tierIndex, payoutAmount } = resolveOnchainPayout(
		payoutNumber,
		payoutDistribution,
	)

	const entropy = deriveCardEntropy({ fulfillment, entryNumber })

	const card = resolveRandomCard(
		cardCollections[tierIndex],
		tierBiases[tierIndex],
		entropy,
	)

	return {
		payoutAmount,
		card,
	}
}

export function resolveOnchainPayout(
	payoutNumber: bigint,
	payoutDistribution: PayoutTier[],
): {
	tierIndex: number
	payoutAmount: bigint
} {
	const { tierIndex, rank } = resolveTier(payoutNumber, payoutDistribution)
	const payoutAmount = resolvePayoutInTier(
		payoutDistribution[tierIndex],
		rank,
	)

	return { tierIndex, payoutAmount }
}

function resolveTier(
	payoutNumber: bigint,
	payoutDistribution: PayoutTier[],
): { tierIndex: number; rank: bigint } {
	let boundary = 0n

	for (let i = 0; i < payoutDistribution.length; i++) {
		boundary += payoutDistribution[i].payoutCount

		if (payoutNumber <= boundary) {
			const rank =
				payoutNumber - (boundary - payoutDistribution[i].payoutCount)
			return { tierIndex: i, rank }
		}
	}

	throw new Error(
		`Payout number ${payoutNumber} exceeded all tier boundaries`,
	)
}

export function resolveRandomCard(
	collection: CardCollection,
	tierBias: bigint,
	entropy: bigint,
): Card {
	const n = collection.length

	if (n === 0) throw new Error('Cannot pick a card from an empty tier')

	// A tier the bias list is too short for arrives here as undefined despite
	// the type, and would otherwise fail deep inside the weight arithmetic.
	if (tierBias === undefined)
		throw new Error('Tier bias is not configured for this tier')

	if (tierBias < 0n)
		throw new Error(`Tier bias must not be negative, got ${tierBias}`)

	// How many unique cards the user already owns in this tier
	let k = 0
	for (const entry of collection) {
		if (entry.count > 0) k++
	}

	const { unseenWeight, seenWeight } = resolveCardWeights(tierBias, k, n)

	// A card's probability is its weight over the total, so an unseen card is
	// unseenWeight / seenWeight times likelier than one the player already has.
	let totalWeight = 0n
	const weights: bigint[] = new Array(n)

	for (let i = 0; i < n; i++) {
		const weight = collection[i].count === 0 ? unseenWeight : seenWeight

		weights[i] = weight
		totalWeight += weight
	}

	// The remainder lies in [0, totalWeight), so subtracting weights always
	// crosses zero before the list runs out — no fallback branch is reachable.
	let roll = entropy % totalWeight

	for (let i = 0; i < n; i++) {
		roll -= weights[i]
		if (roll < 0n) return collection[i].card
	}

	throw new Error('Weighted card pick failed to cross zero')
}

/**
 * Draw weights for one tier, carrying `boost = 1 + tierBias * (1 - k/n)` in
 * exact integers: both weights are scaled by `n`, so the division by `n` never
 * happens and an incomplete collection cannot round down to a boost of 1.
 */
function resolveCardWeights(
	tierBias: bigint,
	k: number,
	n: number,
): { unseenWeight: bigint; seenWeight: bigint } {
	const seenWeight = BigInt(n)

	const unseenWeight = seenWeight + tierBias * BigInt(n - k)

	return { unseenWeight, seenWeight }
}

function resolvePayoutInTier(tier: PayoutTier, rank: bigint): bigint {
	if (tier.payoutCount === 1n) return tier.minPayout

	const payoutRange = tier.maxPayout - tier.minPayout

	return (
		tier.minPayout + (payoutRange * (rank - 1n)) / (tier.payoutCount - 1n)
	)
}
