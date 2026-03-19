import { Inject, Injectable } from '@nestjs/common'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { MAIN_CURRENCY_CHAIN_ADDRESS } from 'src/modules/wallets/wallets.constants'
import { GetBalanceInput, GetBalanceUseCase } from './get-balance.use-case'

@Injectable()
export class GetBalanceService extends GetBalanceUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly currencyService: CurrencyService,
		private readonly walletService: WalletService,

		@Inject(MAIN_CURRENCY_CHAIN_ADDRESS)
		private readonly mainCurrencyChainAddress: ChainAddress,
	) {
		super()
	}

	async execute(input: GetBalanceInput): Promise<CurrencyAmount> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const currency = await this.currencyService.fromAccount(
			this.mainCurrencyChainAddress,
		)

		const amount = await this.walletService.balanceOf(user.wallet, currency)

		return { currency, amount }
	}
}
