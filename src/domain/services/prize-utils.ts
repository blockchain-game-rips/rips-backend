import { Config, PrizeTier } from '../entities/config'
import { Round } from '../entities/round'
import { Card } from '../value-objects/card'
import { CardCollection } from '../value-objects/card-collection'

export function resolvePrize(
	ticketNumber: number,
	randoms: NonNullable<Round['randoms']>,
	config: Config,
	stakeCardCollections: CardCollection[],
	tierBiases: number[],
): {
	card: Card
	prizeAmount: bigint
} {
	const { a, b } = randoms
	const { ticketCup, prizeDistribution } = config

	const n = BigInt(ticketCup)
	const prizeNumber = ((a * BigInt(ticketNumber) + b) % n) + 1n

	const { tierIndex, prizeAmount } = resolveOnchainPrize(
		prizeNumber,
		prizeDistribution,
	)

	const card = resolveRandomCard(
		stakeCardCollections[tierIndex],
		tierBiases[tierIndex],
	)

	return {
		prizeAmount,
		card,
	}
}

export function resolveOnchainPrize(
	prizeNumber: bigint,
	prizeDistribution: PrizeTier[],
): {
	tierIndex: number
	prizeAmount: bigint
} {
	const { tierIndex, rank } = resolveTier(prizeNumber, prizeDistribution)
	const prizeAmount = resolvePrizeInTier(prizeDistribution[tierIndex], rank)

	return { tierIndex, prizeAmount }
}

function resolveTier(
	prizeNumber: bigint,
	prizeDistribution: PrizeTier[],
): { tierIndex: number; rank: bigint } {
	let boundary = 0n

	for (let i = 0; i < prizeDistribution.length; i++) {
		boundary += prizeDistribution[i].prizeCount

		if (prizeNumber <= boundary) {
			const rank =
				prizeNumber - (boundary - prizeDistribution[i].prizeCount)
			return { tierIndex: i, rank }
		}
	}

	throw new Error(`Prize number ${prizeNumber} exceeded all tier boundaries`)
}

export function resolveRandomCard(
	collection: CardCollection,
	tierBias: number,
): Card {
	const n = collection.length

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

function resolvePrizeInTier(tier: PrizeTier, rank: bigint): bigint {
	if (tier.prizeCount === 1n) return tier.minPrize

	const prizeRange = tier.maxPrize - tier.minPrize

	return tier.minPrize + (prizeRange * (rank - 1n)) / (tier.prizeCount - 1n)
}
