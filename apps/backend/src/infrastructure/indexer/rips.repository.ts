import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { getAddress } from 'viem'
import {
	GetCompletedRipsArgs,
	RipRepository,
} from '../../application/interfaces/repositories/rip.repository'
import { CompletedRip, Rip } from '../../domain/entities/rip'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { withCache } from '../cache/with-cache'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerService } from './indexer.service'
import { fromRipRaw } from './utils'

const INDEXER_TTL_MS = 5000

@Injectable()
export class IndexerRipRepository extends RipRepository {
	private readonly chainId: number

	constructor(
		private readonly indexer: IndexerService,
		private readonly evmCurrencyService: EvmCurrencyService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {
		super()
		this.chainId = Number(contract.chain.reference)
	}

	async getCompletedRips({
		limit,
		cursor,
	}: GetCompletedRipsArgs): Promise<CompletedRip[]> {
		const { rips } = await withCache(
			this.cacheManager,
			`indexer-completed-rips-${limit}-${cursor ?? ''}`,
			INDEXER_TTL_MS,
			() =>
				this.indexer.sdk.GetCompletedRips({
					limit,
					cursor: cursor?.toString(),
				}),
		)

		return Promise.all(
			rips.map(async (r) => {
				const currency = await this.evmCurrencyService.fromAddress(
					getAddress(r.config.currency),
					this.chainId,
				)

				return fromRipRaw(r, currency) as CompletedRip
			}),
		)
	}

	async getRipsByIds(ids: Set<number>): Promise<Rip[]> {
		const sortedIds = [...ids].sort((a, b) => a - b)

		const { rips } = await withCache(
			this.cacheManager,
			`indexer-rips-by-ids-${sortedIds.join(',')}`,
			INDEXER_TTL_MS,
			() => this.indexer.sdk.GetRipsByIds({ ids: sortedIds.map(String) }),
		)

		return Promise.all(
			rips.map(async (r) => {
				const currency = await this.evmCurrencyService.fromAddress(
					getAddress(r.config.currency),
					this.chainId,
				)

				return fromRipRaw(r, currency)
			}),
		)
	}

	async getNextCompletedRip(
		afterRipId: number,
	): Promise<CompletedRip | null> {
		const { rips } = await withCache(
			this.cacheManager,
			`indexer-next-completed-rip-${afterRipId}`,
			INDEXER_TTL_MS,
			() =>
				this.indexer.sdk.GetNextCompletedRip({
					afterRipId: String(afterRipId),
				}),
		)

		if (rips.length === 0) {
			return null
		}

		const r = rips[0]
		const currency = await this.evmCurrencyService.fromAddress(
			getAddress(r.config.currency),
			this.chainId,
		)

		return fromRipRaw(r, currency) as CompletedRip
	}
}
