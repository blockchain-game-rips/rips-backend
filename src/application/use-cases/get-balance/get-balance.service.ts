import { Injectable } from '@nestjs/common'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { CurrencyService } from '../../interfaces/currency.service'
import { WalletService } from '../../interfaces/wallet.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { GetBalanceInput, GetBalanceUseCase } from './get-balance.use-case'

@Injectable()
export class GetBalanceService extends GetBalanceUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletService: WalletService,
		private readonly currencyService: CurrencyService,
	) {
		super()
	}

	async execute(input: GetBalanceInput): Promise<CurrencyAmount> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const currency = await this.currencyService.fromAccount(
			input.currencyChainAddress,
		)

		const amount = await this.walletService.balanceOf(user.wallet, currency)

		return { currency: currency, amount }
	}
}
