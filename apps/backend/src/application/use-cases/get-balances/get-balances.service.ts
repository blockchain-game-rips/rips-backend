import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Address, getAddress, isAddressEqual } from 'viem'
import { Currency } from '../../../domain/entities/currency'
import { evmAddressFromWallet } from '../../../domain/services/evm'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { Wallet } from '../../../domain/value-objects/wallet'
import { withCache } from '../../../infrastructure/cache/with-cache'
import {
	AlchemyBalanceService,
	AlchemyRawBalance,
} from '../../../infrastructure/evm/evm-client/alchemy/alchemy-balance.service'
import { NATIVE_ADDRESS } from '../../../infrastructure/evm/primitives/currencies/constants'
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
		private readonly alchemyBalanceService: AlchemyBalanceService,
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

		const address = evmAddressFromWallet(user.wallet)

		const { balancesByChainId, unsupportedChainIds } =
			await this.fetchAlchemyBalances(address, currencies)

		return Promise.all(
			currencies.map((currency) =>
				this.resolveAmount(
					user.wallet,
					currency,
					balancesByChainId,
					unsupportedChainIds,
				),
			),
		)
	}

	private fetchAlchemyBalances(
		address: Address,
		currencies: Currency[],
	): ReturnType<AlchemyBalanceService['fetchBalances']> {
		const chainIds = [
			...new Set(
				currencies.map((currency) =>
					Number(currency.chainAddress.chain.reference),
				),
			),
		].sort((a, b) => a - b)

		const cacheKey = `alchemy-balances-${address}-${chainIds.join(',')}`

		return withCache(this.cacheManager, cacheKey, BALANCES_TTL_MS, () =>
			this.alchemyBalanceService.fetchBalances(address, chainIds),
		)
	}

	private async resolveAmount(
		wallet: Wallet,
		currency: Currency,
		balancesByChainId: Map<number, AlchemyRawBalance[]>,
		unsupportedChainIds: Set<number>,
	): Promise<CurrencyAmount> {
		const chainId = Number(currency.chainAddress.chain.reference)

		if (unsupportedChainIds.has(chainId)) {
			return this.fallbackAmount(wallet, currency)
		}

		const chainBalances = balancesByChainId.get(chainId) ?? []
		const match = this.matchBalance(currency, chainBalances)

		return { currency, amount: match?.balance ?? 0n }
	}

	private matchBalance(
		currency: Currency,
		balances: AlchemyRawBalance[],
	): AlchemyRawBalance | undefined {
		const currencyAddress = getAddress(currency.chainAddress.address)
		const isNative = isAddressEqual(currencyAddress, NATIVE_ADDRESS)

		return balances.find((balance) => {
			if (isNative) return balance.tokenAddress === null

			return (
				balance.tokenAddress !== null &&
				isAddressEqual(balance.tokenAddress, currencyAddress)
			)
		})
	}

	private async fallbackAmount(
		wallet: Wallet,
		currency: Currency,
	): Promise<CurrencyAmount> {
		const amount = await this.walletReadService.balanceOf(wallet, currency)

		return { currency, amount }
	}
}
