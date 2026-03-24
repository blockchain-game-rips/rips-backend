import { PrizeTier } from '../entities/stake'

export function resolveTicketPrize(
	ticketNumber: number,
	randomA: bigint,
	randomB: bigint,
	ticketCap: number,
	prizeDistribution: PrizeTier[],
): bigint {
	const n = BigInt(ticketCap)
	const prizeNumber = ((randomA * BigInt(ticketNumber) + randomB) % n) + 1n

	return resolvePrizeAmount(prizeNumber, prizeDistribution)
}

function resolvePrizeAmount(
	prizeNumber: bigint,
	prizeDistribution: PrizeTier[],
): bigint {
	let boundary = 0n

	for (const tier of prizeDistribution) {
		boundary += tier.prizeCount

		if (prizeNumber <= boundary) {
			const rank = prizeNumber - (boundary - tier.prizeCount)
			return resolvePrizeInTier(tier, rank)
		}
	}

	throw new Error(`Prize number ${prizeNumber} exceeded all tier boundaries`)
}

function resolvePrizeInTier(tier: PrizeTier, rank: bigint): bigint {
	if (tier.prizeCount === 1n) return tier.minPrize

	const prizeRange = tier.maxPrize - tier.minPrize

	return tier.minPrize + (prizeRange * (rank - 1n)) / (tier.prizeCount - 1n)
}
