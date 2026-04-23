import { Injectable } from '@nestjs/common'
import { AvailableStakeNotFoundError } from '../../../domain/errors/stake-not-found.error'
import { ZapQuoteBuyResult } from '../../../domain/value-objects/zap'
import { CurrencyService } from '../../interfaces/currency.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetAvailableStakesUseCase } from '../get-available-stakes/get-available-stakes.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { QuoteZapInput, QuoteZapUseCase } from './quote-zap.use-case'

@Injectable()
export class QuoteZapService extends QuoteZapUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly zapService: ZapService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: QuoteZapInput): Promise<ZapQuoteBuyResult> {
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

		return this.zapService.quoteBuyTickets(user.wallet, {
			stakeId: availableStake.stake.id,
			config,
			paymentCurrency,
			ticketCount,
		})
	}
}
