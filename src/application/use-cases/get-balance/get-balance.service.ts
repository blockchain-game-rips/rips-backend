import { Inject, Injectable } from '@nestjs/common'
import { Currency } from '../../../domain/entities/currency'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { MAIN_CURRENCY } from '../../interfaces/tokens'
import { WalletService } from '../../interfaces/wallet.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { GetBalanceInput, GetBalanceUseCase } from './get-balance.use-case'

@Injectable()
export class GetBalanceService extends GetBalanceUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletService: WalletService,
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {
		super()
	}

	async execute(input: GetBalanceInput): Promise<CurrencyAmount> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const amount = await this.walletService.balanceOf(
			user.wallet,
			this.mainCurrency,
		)

		return { currency: this.mainCurrency, amount }
	}
}
