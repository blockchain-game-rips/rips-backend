import { Injectable } from '@nestjs/common'
import { RipsService } from 'src/application/interfaces/rips.service'
import { TicketNotFoundError } from 'src/domain/errors/stake-not-found.error'
import { Purchase } from 'src/domain/value-objects/purchase'
import { GetAvailableStakesUseCase } from '../get-available-stakes/get-available-stakes.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { BuyTicketsInput, BuyTicketsUseCase } from './buy-tickets.use-case'

@Injectable()
export class BuyTicketsService extends BuyTicketsUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly ripsService: RipsService,
	) {
		super()
	}

	async execute(input: BuyTicketsInput): Promise<Purchase> {
		const { telegramId, stakeId, ticketCount } = input

		const [user, availableStakes] = await Promise.all([
			this.getUserUseCase.execute({ telegramId }),
			this.getAvailableStakesUseCase.execute(),
		])

		const availableStake = availableStakes.find(
			(s) => s.stake.id === stakeId,
		)

		if (!availableStake) {
			//TODO: imrove error naming
			throw new TicketNotFoundError(`Stake with id ${stakeId} not found`)
		}

		const config =
			availableStake.fillingRound !== null
				? availableStake.fillingRound.config
				: availableStake.stake.currentConfig

		return await this.ripsService.buyTickets(user.wallet, {
			stakeId: availableStake.stake.id,
			config,
			ticketCount,
		})
	}
}
