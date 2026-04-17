import { Injectable } from '@nestjs/common'
import { AvailableStakeNotFoundError } from '../../../domain/errors/stake-not-found.error'
import { PurchaseOutcome } from '../../../domain/value-objects/purchase-outcome'
import { CurrencyService } from '../../interfaces/currency.service'
import { RipsService } from '../../interfaces/rips.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetAvailableStakesUseCase } from '../get-available-stakes/get-available-stakes.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { BuyTicketsInput, BuyTicketsUseCase } from './buy-tickets.use-case'

@Injectable()
export class BuyTicketsService extends BuyTicketsUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly ripsService: RipsService,
		private readonly zapService: ZapService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: BuyTicketsInput): Promise<PurchaseOutcome> {
		const {
			telegramId,
			stakeId,
			ticketCount,
			paymentCurrencyChainAddress,
		} = input

		const [user, availableStakes, paymentCurrency] = await Promise.all([
			this.getUserUseCase.execute({ telegramId }),
			this.getAvailableStakesUseCase.execute(),
			this.currencyService.fromAccount(paymentCurrencyChainAddress),
		])

		const availableStake = availableStakes.find(
			(s) => s.stake.id === stakeId,
		)

		if (!availableStake) {
			throw new AvailableStakeNotFoundError(
				`Stake with id ${stakeId} not found in available stakes`,
			)
		}

		const config =
			availableStake.fillingRound !== null
				? availableStake.fillingRound.config
				: availableStake.stake.currentConfig

		if (config.ticketPrice.currency.id === paymentCurrency.id) {
			const res = await this.ripsService.buyTickets(user.wallet, {
				stakeId: availableStake.stake.id,
				config,
				ticketCount,
			})

			return { type: 'purchased', purchaseReceipt: res }
		}

		const res = await this.zapService.buyTickets(user.wallet, {
			paymentCurrency,
			stakeId: availableStake.stake.id,
			config,
			ticketCount,
		})

		return {
			type: 'zap',
			pendingZap: res,
		}
	}
}
