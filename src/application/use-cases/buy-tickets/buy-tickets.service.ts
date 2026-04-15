import { Injectable } from '@nestjs/common'
import { TicketNotFoundError } from '../../../domain/errors/stake-not-found.error'
import { RipsService } from '../../interfaces/rips.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetAvailableStakesUseCase } from '../get-available-stakes/get-available-stakes.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	BuyTicketsInput,
	BuyTicketsResult,
	BuyTicketsUseCase,
} from './buy-tickets.use-case'

@Injectable()
export class BuyTicketsService extends BuyTicketsUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly ripsService: RipsService,
		private readonly zapService: ZapService,
	) {
		super()
	}

	async execute(input: BuyTicketsInput): Promise<BuyTicketsResult> {
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

		if (config.ticketPrice.currency.id === input.paymentCurrency.id) {
			const res = await this.ripsService.buyTickets(user.wallet, {
				stakeId: availableStake.stake.id,
				config,
				ticketCount,
			})

			return { type: 'settled', purchaseReceipt: res }
		}

		const res = await this.zapService.buyTickets(user.wallet, {
			paymentCurrency: input.paymentCurrency,
			stakeId: availableStake.stake.id,
			config,
			ticketCount,
		})
		//TODO: write tg notif in database where zap is finished

		return {
			type: 'pending',
			pendingZap: res,
		}
	}
}
