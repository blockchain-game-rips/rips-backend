import { Inject, Injectable } from '@nestjs/common'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { parseChainId } from 'src/domain/services/chain-id-utils'
import { parseCurrencyId } from 'src/domain/services/currency-id-utils'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { CurrencyId } from 'src/domain/value-objects/currency-id'
import { MAIN_CURRENCY } from 'src/modules/wallets/wallets.constants'
import { GetBalanceInput, GetBalanceUseCase } from './get-balance.use-case'

@Injectable()
export class GetBalanceService extends GetBalanceUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly currencyService: CurrencyService,
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: CurrencyId,
	) {
		super()
	}

	async execute(input: GetBalanceInput): Promise<CurrencyAmount> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const { chainId } = parseCurrencyId(this.mainCurrency)
		const { namespace, reference } = parseChainId(chainId)

		const account = {
			chain: { namespace, reference },
			address: user.evmWallet.address,
		}

		const currency = await this.currencyService.fromAccount(account)
		const amount = await currency.balanceOf(user.evmWallet.address)

		return { currency, amount }
	}
}
