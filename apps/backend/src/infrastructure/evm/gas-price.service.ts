import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { withCache } from '../cache/with-cache'
import { EvmClientService } from './evm-client/evm-client.service'

const GAS_PRICE_TTL_MS = 1000 * 60 * 5

@Injectable()
export class GasPriceService {
	constructor(
		private readonly evmClientService: EvmClientService,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) {}

	getGasPrice(chainId: number): Promise<bigint> {
		return withCache(
			this.cacheManager,
			`gas-price-${chainId}`,
			GAS_PRICE_TTL_MS,
			() => this.evmClientService.getClient(chainId).getGasPrice(),
		)
	}
}
