import { Config, PayoutTier } from '../entities/config'
import { Rip } from '../entities/rip'
import { Card } from '../value-objects/card'
import { CardCollection } from '../value-objects/card-collection'

export function resolvePayout(
	entryNumber: number,
	randoms: NonNullable<Rip['randoms']>,
	config: Config,
	presetCardCollections: CardCollection[],
	tierBiases: number[],
): {
	card: Card
	payoutAmount: bigint
} {
	const { a, b } = randoms
	const { entryCap, payoutDistribution } = config

	const n = BigInt(entryCap)
	const payoutNumber = ((a * BigInt(entryNumber) + b) % n) + 1n

	const { tierIndex, payoutAmount } = resolveOnchainPayout(
		payoutNumber,
		payoutDistribution,
	)

	const card = resolveRandomCard(
		presetCardCollections[tierIndex],
		tierBiases[tierIndex],
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
	tierBias: number,
): Card {
	const n = collection.length

	if (n === 0) throw new Error('Cannot pick a card from an empty tier')

	if (!Number.isFinite(tierBias))
		throw new Error(`Tier bias must be a finite number, got ${tierBias}`)

	// How many unique cards the user already owns in this tier
	let k = 0
	for (const entry of collection) {
		if (entry.count > 0) k++
	}

	// boost > 1 while collection is incomplete, = 1 when fully collected
	const boost = 1 + tierBias * (1 - k / n)

	// Each card gets a weight: unseen = boost, seen = 1
	// A card's probability = its weight / totalWeight
	// e.g. 3 cards, boost=2.33: seen=1, unseen=2.33, unseen=2.33 → total=5.66
	// probabilities: 17.7%, 41.2%, 41.2% — unseen cards are boost times more likely
	let totalWeight = 0
	const weights: number[] = new Array(n)

	for (let i = 0; i < n; i++) {
		const w = collection[i].count === 0 ? boost : 1
		weights[i] = w
		totalWeight += w
	}

	// Weighted pick: subtract weights until roll crosses zero
	let roll = Math.random() * totalWeight

	for (let i = 0; i < n; i++) {
		roll -= weights[i]
		if (roll < 0) return collection[i].card
	}

	// Floating point fallback
	return collection[n - 1].card
}

function resolvePayoutInTier(tier: PayoutTier, rank: bigint): bigint {
	if (tier.payoutCount === 1n) return tier.minPayout

	const payoutRange = tier.maxPayout - tier.minPayout

	return (
		tier.minPayout + (payoutRange * (rank - 1n)) / (tier.payoutCount - 1n)
	)
}
