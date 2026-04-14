import { Injectable } from '@nestjs/common'
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

		if (revealAll) {
			return this.ticketPrizeRepository.revealAllAndGet(user.id)
		}

		const prize = await this.ticketPrizeRepository.revealAndGet(user.id)

		return prize ? [prize] : []
	}
}
