import { Inject, Injectable } from '@nestjs/common'
import { BalancesService } from 'src/application/interfaces/balances.service'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { Account } from 'src/domain/value-objects/account'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { MAIN_CURRENCY_ACCOUNT } from 'src/modules/wallets/wallets.constants'
import { GetBalanceInput, GetBalanceUseCase } from './get-balance.use-case'

@Injectable()
export class GetBalanceService extends GetBalanceUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly currencyService: CurrencyService,
		private readonly balancesService: BalancesService,
		@Inject(MAIN_CURRENCY_ACCOUNT)
		private readonly mainCurrencyAccount: Account,
	) {
		super()
	}

	async execute(input: GetBalanceInput): Promise<CurrencyAmount> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const currency = await this.currencyService.fromAccount(
			this.mainCurrencyAccount,
		)

		const amount = await this.balancesService.balanceOf(user, currency)

		return { currency, amount }
	}
}
