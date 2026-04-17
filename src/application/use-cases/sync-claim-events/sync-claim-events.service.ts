import { Inject, Injectable } from '@nestjs/common'
import { CompletedRound, RoundStatus } from '../../../domain/entities/round'
import { resolvePrize } from '../../../domain/services/prize-utils'
import { PurchaseAction } from '../../../domain/value-objects/actions'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'
import {
	RoundSyncRepository,
	UserPrizes,
} from '../../interfaces/repositories/round-sync.repository'
import { RoundRepository } from '../../interfaces/repositories/round.repository'
import { TicketPrizeRepository } from '../../interfaces/repositories/ticket-prize.repository'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import { STAKE_TO_TIER_BIASES } from '../../interfaces/tokens'
import { SyncClaimEventsUseCase } from './sync-claim-events.use-case'

@Injectable()
export class SyncClaimEventsService extends SyncClaimEventsUseCase {
	constructor(
		private readonly roundRepository: RoundRepository,
		private readonly userRepository: UserRepository,
		private readonly ticketPrizeRepository: TicketPrizeRepository,
		private readonly roundSyncRepository: RoundSyncRepository,

		@Inject(STAKE_TO_TIER_BIASES)
		private readonly stakeToBiases: Map<number, number[]>,
	) {
		super()
	}

	async execute(): Promise<void> {
		const highestRoundId =
			(await this.roundSyncRepository.getHighestSyncedRoundId()) ?? 0

		const round =
			await this.roundRepository.getNextCompletedRound(highestRoundId)

		if (!round) return

		if (round.status === RoundStatus.CLAIMED) {
			await this.syncClaimedRound(round)
		} else {
			await this.syncRefundedRound(round)
		}
	}

	private async syncClaimedRound(round: CompletedRound): Promise<void> {
		const entries = await this.resolveRoundPrizes(round)

		await this.roundSyncRepository.syncClaimedRound({
			roundId: round.id,
			entries,
		})
	}

	private async syncRefundedRound(round: CompletedRound): Promise<void> {
		const userIds = await this.resolveParticipantUserIds(round)

		await this.roundSyncRepository.syncRefundedRound({
			roundId: round.id,
			userIds,
		})
	}

	private async resolveParticipantUserIds(
		round: CompletedRound,
	): Promise<bigint[]> {
		const uniqueAddresses = [
			...new Set(round.actions.purchases.map((p) => p.userAddress)),
		]

		const userIds: bigint[] = []

		for (const address of uniqueAddresses) {
			const user = await this.userRepository.findByEvmAddress(address)
			if (user) userIds.push(user.id)
		}

		return userIds
	}

	private hasRandoms(round: CompletedRound): round is CompletedRound & {
		randoms: NonNullable<CompletedRound['randoms']>
	} {
		return round.randoms !== undefined
	}

	private async resolveRoundPrizes(
		round: CompletedRound,
	): Promise<UserPrizes[]> {
		if (!this.hasRandoms(round))
			throw new Error(`Round ${round.id} is missing randoms`)

		const purchasesByAddress = new Map<string, PurchaseAction[]>()

		for (const purchase of round.actions.purchases) {
			const existing = purchasesByAddress.get(purchase.userAddress) ?? []
			purchasesByAddress.set(purchase.userAddress, [
				...existing,
				purchase,
			])
		}

		const entries: UserPrizes[] = []

		for (const [address, purchases] of purchasesByAddress) {
			const entry = await this.resolveUserPrizes(
				round,
				address,
				purchases,
			)
			if (entry) entries.push(entry)
		}

		return entries
	}

	private async resolveUserPrizes(
		round: CompletedRound & {
			randoms: NonNullable<CompletedRound['randoms']>
		},
		address: string,
		purchases: PurchaseAction[],
	): Promise<UserPrizes | null> {
		const user = await this.userRepository.findByEvmAddress(address)
		if (!user) return null

		const stakeCardCollections =
			await this.ticketPrizeRepository.getCardCollectionsByStake(
				user.id,
				round.stake.id,
			)

		const tierBiases = this.stakeToBiases.get(round.stake.id) ?? []
		const prizes: TicketPrize[] = []

		for (const purchase of purchases) {
			for (let i = 0; i < purchase.ticketCount; i++) {
				const ticketNumber = Number(purchase.startTicketIndex) + i + 1

				const prize = resolvePrize(
					ticketNumber,
					round,
					stakeCardCollections,
					tierBiases,
				)

				const tierCollection = stakeCardCollections[prize.card.tier]
				const cardIndex = tierCollection.findIndex(
					(c) => c.card.id === prize.card.id,
				)
				tierCollection[cardIndex].count += 1

				prizes.push(prize)
			}
		}

		return { userId: user.id, prizes }
	}
}
