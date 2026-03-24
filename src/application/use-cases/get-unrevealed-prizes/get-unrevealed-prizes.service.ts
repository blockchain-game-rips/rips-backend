import { Injectable } from '@nestjs/common'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { TicketPrize } from 'src/domain/entities/ticket-prize'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	GetUnrevealedPrizesInput,
	GetUnrevealedPrizesUseCase,
} from './get-unrevealed-prizes.use-case'

@Injectable()
export class GetUnrevealedPrizesService extends GetUnrevealedPrizesUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly ticketPrizeRepository: TicketPrizeRepository,
	) {
		super()
	}

	async execute({
		telegramId,
	}: GetUnrevealedPrizesInput): Promise<TicketPrize[]> {
		const user = await this.getUserUseCase.execute({ telegramId })

		return this.ticketPrizeRepository.getUnrevealed(user.id)
	}
}
