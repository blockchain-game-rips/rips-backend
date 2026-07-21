import { Injectable, Logger, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WalletReadService } from '../../application/interfaces/wallet-read.service'
import {
	DEFAULT_USE_ALCHEMY_BALANCES,
	USE_ALCHEMY_BALANCES_KEY,
} from '../../configuration/configuration'
import { Currency } from '../../domain/entities/currency'
import { evmAddressFromWallet } from '../../domain/services/evm'
import { CurrencyId } from '../../domain/value-objects/currency-id'
import { Wallet } from '../../domain/value-objects/wallet'
import { AlchemyBalanceService } from '../evm/evm-client/alchemy/alchemy-balance.service'
import { EvmCurrencyReadService } from '../evm/evm-currency-read.service'
import { EvmCurrency } from '../evm/primitives/currencies/evm-currency'

@Injectable()
export class WalletReadServiceImpl extends WalletReadService {
	private readonly logger = new Logger(WalletReadServiceImpl.name)

	constructor(
		private readonly evmCurrencyReadService: EvmCurrencyReadService,
		private readonly alchemyBalanceService: AlchemyBalanceService,
		@Optional() private readonly configService?: ConfigService,
	) {
		super()
	}

	balanceOf(wallet: Wallet, currency: Currency): Promise<bigint> {
		if (currency instanceof EvmCurrency) {
			const userAddress = evmAddressFromWallet(wallet)

			return this.evmCurrencyReadService.balanceOf(currency, userAddress)
		}

		throw new Error(`Unsupported currency: ${currency.id}`)
	}

	async balancesOf(
		wallet: Wallet,
		currencies: Currency[],
	): Promise<Map<CurrencyId, bigint>> {
		if (!this.useAlchemyBalances()) {
			return this.rpcBalances(wallet, currencies)
		}

		const address = evmAddressFromWallet(wallet)

		try {
			const { balances, uncoveredCurrencies } =
				await this.alchemyBalanceService.balancesFor(
					address,
					currencies,
				)

			const fallback = await this.rpcBalances(wallet, uncoveredCurrencies)

			return new Map([...balances, ...fallback])
		} catch (error) {
			this.logger.warn(
				`Alchemy balance fetch failed, falling back to RPC: ${String(error)}`,
			)

			return this.rpcBalances(wallet, currencies)
		}
	}

	private async rpcBalances(
		wallet: Wallet,
		currencies: Currency[],
	): Promise<Map<CurrencyId, bigint>> {
		const entries = await Promise.all(
			currencies.map(
				async (currency): Promise<[CurrencyId, bigint]> => [
					currency.id,
					await this.balanceOf(wallet, currency),
				],
			),
		)

		return new Map(entries)
	}

	private useAlchemyBalances(): boolean {
		const configured: unknown = this.configService?.get(
			USE_ALCHEMY_BALANCES_KEY,
		)

		return typeof configured === 'boolean'
			? configured
			: DEFAULT_USE_ALCHEMY_BALANCES
	}
}
