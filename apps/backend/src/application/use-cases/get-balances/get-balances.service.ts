import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Currency } from '../../../domain/entities/currency'
import { evmAddressFromWallet } from '../../../domain/services/evm'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { Wallet } from '../../../domain/value-objects/wallet'
import { withCache } from '../../../infrastructure/cache/with-cache'
import { CurrencyService } from '../../interfaces/currency.service'
import { WalletReadService } from '../../interfaces/wallet-read.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { GetBalancesInput, GetBalancesUseCase } from './get-balances.use-case'

const BALANCES_TTL_MS = 5000

@Injectable()
export class GetBalancesService extends GetBalancesUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletReadService: WalletReadService,
		private readonly currencyService: CurrencyService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {
		super()
	}

	async execute(input: GetBalancesInput): Promise<CurrencyAmount[]> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const currencies = await Promise.all(
			input.currencyChainAddresses.map((chainAddress) =>
				this.currencyService.fromAccount(chainAddress),
			),
		)

		const balances = await this.fetchBalances(user.wallet, currencies)

		return currencies.map((currency) => ({
			currency,
			amount: balances.get(currency.id) ?? 0n,
		}))
	}

	private fetchBalances(
		wallet: Wallet,
		currencies: Currency[],
	): Promise<Map<CurrencyId, bigint>> {
		const address = evmAddressFromWallet(wallet)
		const currencyIds = currencies.map((currency) => currency.id).sort()

		const cacheKey = `balances-${address}-${currencyIds.join(',')}`

		return withCache(this.cacheManager, cacheKey, BALANCES_TTL_MS, () =>
			this.walletReadService.balancesOf(wallet, currencies),
		)
	}
}
