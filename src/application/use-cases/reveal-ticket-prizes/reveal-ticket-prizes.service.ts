import { Injectable } from '@nestjs/common'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { TicketPrize } from 'src/domain/value-objects/ticket-prize'
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
