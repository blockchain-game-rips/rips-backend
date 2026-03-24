import { Injectable } from '@nestjs/common'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { Round } from 'src/domain/entities/round'
import { resolveTicketPrize } from 'src/domain/services/prize-utils'
import { PurchaseAction } from 'src/domain/value-objects/actions'
import { RipsKeeperService } from 'src/infrastructure/rips/rips-keeper.service'
import { HandleClaimInput, HandleClaimUseCase } from './handle-claim.use-case'

@Injectable()
export class HandleClaimService extends HandleClaimUseCase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly ticketPrizeRepository: TicketPrizeRepository,
		private readonly ripsKeeperService: RipsKeeperService,
	) {
		super()
	}

	async execute({ round }: HandleClaimInput): Promise<void> {
		const uniqueClaimedAddresses = new Set(
			round.actions.claims.map((c) => c.userAddress),
		)

		for (const purchase of round.actions.purchases) {
			if (uniqueClaimedAddresses.has(purchase.userAddress)) continue

			try {
				await this.ripsKeeperService.claim(
					round.id,
					purchase.userAddress,
				)
				await this.savePrizes(round, purchase)
			} catch (error) {
				console.log(error)
			}
		}
	}

	private async savePrizes(
		round: Round,
		purchase: PurchaseAction,
	): Promise<void> {
		if (!round.randoms) return

		const user = await this.userRepository.findByEvmAddress(
			purchase.userAddress,
		)
		if (!user) return

		const { a, b } = round.randoms
		const { ticketCup, prizeDistribution } = round.stake

		const prizes = Array.from(
			{ length: Number(purchase.ticketAmount) },
			(_, i) => {
				const ticketNumber = Number(purchase.startTicketIndex) + i + 1

				return {
					roundId: round.id,
					ticketNumber,
					stakeId: round.stake.id,
					prizeAmount: resolveTicketPrize(
						ticketNumber,
						a,
						b,
						ticketCup,
						prizeDistribution,
					),
				}
			},
		)

		await this.ticketPrizeRepository.upsertMany(user.id, prizes)
	}
}
