import { Injectable, Logger } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'
import { TicketPrizeRepository } from '../../interfaces/repositories/ticket-prize.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	RevealTicketPrizesInput,
	RevealTicketPrizesUseCase,
} from './reveal-ticket-prizes.use-case'

@Injectable()
export class RevealTicketPrizesService extends RevealTicketPrizesUseCase {
	private readonly logger = new Logger(RevealTicketPrizesService.name)

	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly ticketPrizeRepository: TicketPrizeRepository,
	) {
		super()
	}

	async execute({
		telegramId,
		revealAll,
	}: RevealTicketPrizesInput): Promise<TicketPrize[]> {
		const user = await this.getUserUseCase.execute({ telegramId })
		const userAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		if (revealAll) {
			const prizes =
				await this.ticketPrizeRepository.revealAllAndGet(userAddress)

			for (const prize of prizes) {
				this.logger.log(
					{
						userId: user.id.toString(),
						ticketId: prize.ticketNumber,
						prizeAmount: prize.prizeAmount.toString(),
						cardId: prize.card.id,
						cardTier: prize.card.tier,
					},
					'Prize revealed',
				)
			}

			return prizes
		}

		const prize = await this.ticketPrizeRepository.revealAndGet(userAddress)

		if (prize) {
			this.logger.log(
				{
					userId: user.id.toString(),
					ticketId: prize.ticketNumber,
					prizeAmount: prize.prizeAmount.toString(),
					cardId: prize.card.id,
					cardTier: prize.card.tier,
				},
				'Prize revealed',
			)
		}

		return prize ? [prize] : []
	}
}
