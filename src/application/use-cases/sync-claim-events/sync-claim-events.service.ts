import { Inject, Injectable } from '@nestjs/common'
import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { TIER_BIASES } from 'src/application/interfaces/tokens'
import { CompletedRound } from 'src/domain/entities/round'
import { resolvePrize } from 'src/domain/services/prize-utils'
import { PurchaseAction } from 'src/domain/value-objects/actions'
import { TicketPrize } from 'src/domain/value-objects/ticket-prize'
import { SyncClaimEventsUseCase } from './sync-claim-events.use-case'

@Injectable()
export class SyncClaimEventsService extends SyncClaimEventsUseCase {
	constructor(
		private readonly roundRepository: RoundRepository,
		private readonly userRepository: UserRepository,
		private readonly ticketPrizeRepository: TicketPrizeRepository,

		@Inject(TIER_BIASES)
		private readonly tierBiases: number[],
	) {
		super()
	}

	async execute(): Promise<void> {
		const highestRoundId =
			(await this.ticketPrizeRepository.getHighestRoundId()) ?? 0

		const round =
			await this.roundRepository.getNextClaimedRound(highestRoundId)
		if (!round) return

		const entries = await this.resolveRoundPrizes(round)

		await this.ticketPrizeRepository.saveManyForRound(entries)
	}

	private hasRandoms(round: CompletedRound): round is CompletedRound & {
		randoms: NonNullable<CompletedRound['randoms']>
	} {
		return round.randoms !== undefined
	}

	private async resolveRoundPrizes(
		round: CompletedRound,
	): Promise<{ userId: bigint; prizes: TicketPrize[] }[]> {
		if (!this.hasRandoms(round))
			throw new Error(`Round ${round.id} is missing randoms`)

		const entries: { userId: bigint; prizes: TicketPrize[] }[] = []

		for (const purchase of round.actions.purchases) {
			const entry = await this.resolvePurchasePrizes(round, purchase)
			if (entry) entries.push(entry)
		}

		return entries
	}

	private async resolvePurchasePrizes(
		round: CompletedRound & {
			randoms: NonNullable<CompletedRound['randoms']>
		},
		purchase: PurchaseAction,
	): Promise<{ userId: bigint; prizes: TicketPrize[] } | null> {
		const user = await this.userRepository.findByEvmAddress(
			purchase.userAddress,
		)
		if (!user) return null

		const stakeCardCollections =
			await this.ticketPrizeRepository.getStakeCardCollections(
				user.id,
				round.stake.id,
			)

		const prizes: TicketPrize[] = []

		for (let i = 0; i < purchase.ticketCount; i++) {
			const ticketNumber = Number(purchase.startTicketIndex) + i + 1

			const prize = resolvePrize(
				ticketNumber,
				round,
				stakeCardCollections,
			)

			const tierCollection = stakeCardCollections[prize.card.tier]
			const cardIndex = tierCollection.findIndex(
				(c) => c.card.id === prize.card.id,
			)
			tierCollection[cardIndex].count += 1

			prizes.push(prize)
		}

		return { userId: user.id, prizes }
	}
}
