import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { withCache } from '../../../infrastructure/cache/with-cache'
import { CurrencyService } from '../../interfaces/currency.service'
import { WalletService } from '../../interfaces/wallet.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { GetBalanceInput, GetBalanceUseCase } from './get-balance.use-case'

const BALANCE_TTL_MS = 5000

@Injectable()
export class GetBalanceService extends GetBalanceUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletService: WalletService,
		private readonly currencyService: CurrencyService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {
		super()
	}

	execute(input: GetBalanceInput): Promise<CurrencyAmount> {
		return withCache(
			this.cacheManager,
			`balance-${input.telegramId}-${input.currencyChainAddress.chain.namespace}:${input.currencyChainAddress.chain.reference}:${input.currencyChainAddress.address}`,
			BALANCE_TTL_MS,
			() => this.fetchBalance(input),
		)
	}

	private async fetchBalance(
		input: GetBalanceInput,
	): Promise<CurrencyAmount> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const currency = await this.currencyService.fromAccount(
			input.currencyChainAddress,
		)

		const amount = await this.walletService.balanceOf(user.wallet, currency)

		return { currency, amount }
	}
}
