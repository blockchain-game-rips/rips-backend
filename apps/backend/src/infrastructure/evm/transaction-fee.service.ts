import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { CurrencyAmount } from '../../domain/value-objects/currency-amount'
import { withCache } from '../cache/with-cache'
import { EvmClientService } from './evm-client/evm-client.service'
import { EvmCurrencyService } from './evm-currency.service'

const GAS_PRICE_TTL_MS = 1000 * 60 * 5

@Injectable()
export class TransactionFeeService {
	constructor(
		private readonly evmClientService: EvmClientService,
		private readonly evmCurrencyService: EvmCurrencyService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	async estimateFee(
		gasLimit: bigint,
		chainId: number,
	): Promise<CurrencyAmount> {
		const gasPrice = await this.getGasPrice(chainId)

		return {
			currency: this.evmCurrencyService.getNative(chainId),
			amount: gasLimit * gasPrice,
		}
	}

	private getGasPrice(chainId: number): Promise<bigint> {
		return withCache(
			this.cacheManager,
			`gas-price-${chainId}`,
			GAS_PRICE_TTL_MS,
			() => this.evmClientService.getClient(chainId).getGasPrice(),
		)
	}
}
