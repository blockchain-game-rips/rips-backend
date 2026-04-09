import { Injectable } from '@nestjs/common'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { RipsService } from 'src/application/interfaces/rips.service'
import { Round } from 'src/domain/entities/round'
import { resolvePrize } from 'src/domain/services/prize-utils'
import { PurchaseAction } from 'src/domain/value-objects/actions'
import { TicketPrize } from 'src/domain/value-objects/ticket-prize'
import { HandleClaimInput, HandleClaimUseCase } from './handle-claim.use-case'

@Injectable()
export class HandleClaimService extends HandleClaimUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly ticketPrizeRepository: TicketPrizeRepository,
		private readonly ripsService: RipsService,
	) {
		super()
	}

	async execute({ round, executor }: HandleClaimInput): Promise<void> {
		const uniqueClaimedAddresses = new Set(
			round.actions.claims.map((c) => c.userAddress),
		)

		for (const purchase of round.actions.purchases) {
			if (uniqueClaimedAddresses.has(purchase.userAddress)) continue

			try {
				await this.ripsService.claim(executor.wallet, {
					roundId: round.id,
					userAddress: purchase.userAddress,
				})
				await this.savePrizes(round, purchase)
			} catch (error) {
				console.log(error)
			}
		}
	}

	private hasRandoms(
		round: Round,
	): round is Round & { randoms: NonNullable<Round['randoms']> } {
		return round.randoms !== undefined
	}

	private async savePrizes(
		round: Round,
		purchase: PurchaseAction,
	): Promise<void> {
		if (!this.hasRandoms(round)) throw new Error("Randoms don't exist")

		const user = await this.userRepository.findByEvmAddress(
			purchase.userAddress,
		)
		if (!user) return

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

			const cardWithCountIndex = stakeCardCollections[
				prize.card.tier
			].findIndex(
				(cardWithCount) => cardWithCount.card.id === prize.card.id,
			)
			stakeCardCollections[prize.card.tier][cardWithCountIndex].count += 1

			prizes.push(prize)
		}

		await this.ticketPrizeRepository.upsertMany(user.id, prizes) //TODO: why upsert, what if prize is revealed
	}
}
