import { Injectable } from '@nestjs/common'
import { RipsService } from 'src/application/interfaces/rips.service'
import { TicketNotFoundError } from 'src/domain/errors/stake-not-found.error'
import { Purchase } from 'src/domain/value-objects/purchase'
import { GetStakesUseCase } from '../get-stakes/get-stakes.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { BuyTicketsInput, BuyTicketsUseCase } from './buy-tickets.use-case'

@Injectable()
export class BuyTicketsService extends BuyTicketsUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getStakesUseCase: GetStakesUseCase,
		private readonly ripsService: RipsService,
	) {
		super()
	}

	async execute(input: BuyTicketsInput): Promise<Purchase> {
		const { telegramId, stakeId, amount } = input

		const [user, stakes] = await Promise.all([
			this.getUserUseCase.execute({ telegramId }),
			this.getStakesUseCase.execute(),
		])

		const stake = stakes.find((s) => s.id === stakeId)

		if (!stake) {
			throw new TicketNotFoundError(`Stake with id ${stakeId} not found`)
		}

		return this.ripsService.buyTickets(user.wallet, { stake, amount })
	}
}
