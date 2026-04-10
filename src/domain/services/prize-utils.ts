import { PrizeTier } from '../entities/config'
import { Round } from '../entities/round'
import { Card } from '../value-objects/card'
import { CardCollection } from '../value-objects/card-collection'
import { TicketPrize } from '../value-objects/ticket-prize'

//TODO: test against smart contract calling
export function resolvePrize(
	ticketNumber: number,
	round: Round & { randoms: NonNullable<Round['randoms']> },
	stakeCardCollections: CardCollection[],
): TicketPrize {
	const { a, b } = round.randoms
	const { ticketCup, prizeDistribution } = round.config

	const n = BigInt(ticketCup)
	const prizeNumber = ((a * BigInt(ticketNumber) + b) % n) + 1n

	const { tierIndex, rank } = resolveTier(prizeNumber, prizeDistribution)
	const prizeAmount = resolvePrizeInTier(prizeDistribution[tierIndex], rank)

	// TODO: implement weighted card selection based on user's existing collection
	const card = resolveRandomCard(stakeCardCollections[tierIndex])

	return {
		roundId: round.id,
		ticketNumber,
		prizeAmount,
		revealed: false,
		card,
	}
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

function resolveRandomCard(collection: CardCollection): Card {
	const index = Math.floor(Math.random() * collection.length)
	return collection[index].card
}

function resolvePrizeInTier(tier: PrizeTier, rank: bigint): bigint {
	if (tier.prizeCount === 1n) return tier.minPrize

	const prizeRange = tier.maxPrize - tier.minPrize

	return tier.minPrize + (prizeRange * (rank - 1n)) / (tier.prizeCount - 1n)
}
