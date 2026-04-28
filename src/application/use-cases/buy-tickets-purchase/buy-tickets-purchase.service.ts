import { Injectable } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import { AvailableStakeNotFoundError } from '../../../domain/errors/stake-not-found.error'
import { PurchaseReceipt } from '../../../domain/value-objects/purchase-receipt'
import { CurrencyService } from '../../interfaces/currency.service'
import { RipsService } from '../../interfaces/rips.service'
import { GetAvailableStakesUseCase } from '../get-available-stakes/get-available-stakes.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	BuyTicketsPurchaseInput,
	BuyTicketsPurchaseUseCase,
} from './buy-tickets-purchase.use-case'

@Injectable()
export class BuyTicketsPurchaseService extends BuyTicketsPurchaseUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly ripsService: RipsService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: BuyTicketsPurchaseInput): Promise<PurchaseReceipt> {
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

		if (config.ticketPrice.currency.id !== paymentCurrency.id) {
			throw new CurrenciesMismatchError(
				`Payment currency ${paymentCurrency.id} does not match ticket price currency ${config.ticketPrice.currency.id}`,
			)
		}

		return this.ripsService.buyTickets(user.wallet, {
			stakeId: availableStake.stake.id,
			config,
			ticketCount,
		})
	}
}
