import { Injectable } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import { AvailableStakeNotFoundError } from '../../../domain/errors/stake-not-found.error'
import { TransactionQuote } from '../../../domain/value-objects/transaction'
import { CurrencyService } from '../../interfaces/currency.service'
import { RipsService } from '../../interfaces/rips.service'
import { GetAvailableStakesUseCase } from '../get-available-stakes/get-available-stakes.use-case'
import {
	QuotePurchaseInput,
	QuotePurchaseUseCase,
} from './quote-purchase.use-case'

@Injectable()
export class QuotePurchaseService extends QuotePurchaseUseCase {
	constructor(
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly currencyService: CurrencyService,
		private readonly ripsService: RipsService,
	) {
		super()
	}

	async execute(input: QuotePurchaseInput): Promise<TransactionQuote> {
		const { stakeId, paymentCurrencyChainAddress } = input

		const [availableStakes, paymentCurrency] = await Promise.all([
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

		return await this.ripsService.quoteBuyTickets()
	}
}
