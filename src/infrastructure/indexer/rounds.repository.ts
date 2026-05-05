import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { getAddress } from 'viem'
import {
	GetCompletedRoundsArgs,
	RoundRepository,
} from '../../application/interfaces/repositories/round.repository'
import { CompletedRound, Round } from '../../domain/entities/round'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { withCache } from '../cache/with-cache'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerService } from './indexer.service'
import { fromRoundRaw } from './utils'

const INDEXER_TTL_MS = 5000

@Injectable()
export class IndexerRoundRepository extends RoundRepository {
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

	async getCompletedRounds({
		limit,
		cursor,
	}: GetCompletedRoundsArgs): Promise<CompletedRound[]> {
		const { rounds } = await withCache(
			this.cacheManager,
			`indexer-completed-rounds-${limit}-${cursor ?? ''}`,
			INDEXER_TTL_MS,
			() =>
				this.indexer.sdk.GetCompletedRounds({
					limit,
					cursor: cursor?.toString(),
				}),
		)

		return Promise.all(
			rounds.map(async (r) => {
				const currency = await this.evmCurrencyService.fromAddress(
					getAddress(r.config.currency),
					this.chainId,
				)

				return fromRoundRaw(r, currency) as CompletedRound
			}),
		)
	}

	async getRoundsByIds(ids: Set<number>): Promise<Round[]> {
		const sortedIds = [...ids].sort((a, b) => a - b)

		const { rounds } = await withCache(
			this.cacheManager,
			`indexer-rounds-by-ids-${sortedIds.join(',')}`,
			INDEXER_TTL_MS,
			() =>
				this.indexer.sdk.GetRoundsByIds({ ids: sortedIds.map(String) }),
		)

		return Promise.all(
			rounds.map(async (r) => {
				const currency = await this.evmCurrencyService.fromAddress(
					getAddress(r.config.currency),
					this.chainId,
				)

				return fromRoundRaw(r, currency)
			}),
		)
	}

	async getNextCompletedRound(
		afterRoundId: number,
	): Promise<CompletedRound | null> {
		const { rounds } = await withCache(
			this.cacheManager,
			`indexer-next-completed-round-${afterRoundId}`,
			INDEXER_TTL_MS,
			() =>
				this.indexer.sdk.GetNextCompletedRound({
					afterRoundId: String(afterRoundId),
				}),
		)

		if (rounds.length === 0) {
			return null
		}

		const r = rounds[0]
		const currency = await this.evmCurrencyService.fromAddress(
			getAddress(r.config.currency),
			this.chainId,
		)

		return fromRoundRaw(r, currency) as CompletedRound
	}
}
