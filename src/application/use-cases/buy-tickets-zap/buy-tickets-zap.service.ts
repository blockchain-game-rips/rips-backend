import { Injectable, Logger } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import { AvailableStakeNotFoundError } from '../../../domain/errors/stake-not-found.error'
import { PendingZap } from '../../../domain/value-objects/zap'
import { CurrencyService } from '../../interfaces/currency.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetAvailableStakesUseCase } from '../get-available-stakes/get-available-stakes.use-case'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	BuyTicketsZapInput,
	BuyTicketsZapUseCase,
} from './buy-tickets-zap.use-case'

@Injectable()
export class BuyTicketsZapService extends BuyTicketsZapUseCase {
	private readonly logger = new Logger(BuyTicketsZapService.name)

	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly getAvailableStakesUseCase: GetAvailableStakesUseCase,
		private readonly zapService: ZapService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: BuyTicketsZapInput): Promise<PendingZap> {
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
			throw new CurrenciesMismatchError(
				`Payment currency ${paymentCurrency.id} matches ticket price currency — use direct purchase instead of zap`,
			)
		}

		const ticketCurrency = config.ticketPrice.currency

		const pendingZap = await this.zapService.buyTickets(user.wallet, {
			paymentCurrency,
			stakeId: availableStake.stake.id,
			config,
			ticketCount,
		})

		this.logger.log(
			{
				userId: user.id.toString(),
				txHash: pendingZap.srcTransaction.id,
				fromChain: paymentCurrency.chainAddress.chain.reference,
				toChain: ticketCurrency.chainAddress.chain.reference,
				fromAmount: pendingZap.amountIn.amount.toString(),
				fromToken: paymentCurrency.chainAddress.address,
				toToken: ticketCurrency.chainAddress.address,
			},
			'Buy tickets zap initiated',
		)

		return pendingZap
	}
}
