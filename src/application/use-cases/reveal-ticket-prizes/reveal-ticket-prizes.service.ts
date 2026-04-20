import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'
import { TicketPrizeRepository } from '../../interfaces/repositories/ticket-prize.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	RevealTicketPrizesInput,
	RevealTicketPrizesUseCase,
} from './reveal-ticket-prizes.use-case'

@Injectable()
export class RevealTicketPrizesService extends RevealTicketPrizesUseCase {
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
		const userAddress = user.wallet.namespaceToAddress[EIP155]

		if (revealAll) {
			return this.ticketPrizeRepository.revealAllAndGet(userAddress)
		}

		const prize = await this.ticketPrizeRepository.revealAndGet(userAddress)

		return prize ? [prize] : []
	}
}
