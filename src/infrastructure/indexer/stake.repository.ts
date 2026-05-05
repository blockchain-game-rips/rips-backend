import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { getAddress } from 'viem'
import { StakeRepository } from '../../application/interfaces/repositories/stake.repository'
import { OngoingRound, RoundStatus } from '../../domain/entities/round'
import { Stake } from '../../domain/entities/stake'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { StakeWithOngoingRounds } from '../../domain/value-objects/stake-with-ongoing-rounds'
import { withCache } from '../cache/with-cache'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerService } from './indexer.service'
import { fromConfigRaw, fromRoundRaw, resolveRoundStatus } from './utils'

const INDEXER_TTL_MS = 5000

const ONGOING_STATUSES = new Set([
	RoundStatus.FILLING,
	RoundStatus.SEALED,
	RoundStatus.VRF_REQUESTED,
	RoundStatus.CLAIMING,
	RoundStatus.REFUNDING,
])

@Injectable()
export class IndexerStakeRepository extends StakeRepository {
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

	async getStakesWithOngoingRounds(): Promise<StakeWithOngoingRounds[]> {
		const { stakes } = await withCache(
			this.cacheManager,
			'indexer-stakes-with-ongoing-rounds',
			INDEXER_TTL_MS,
			() => this.indexer.sdk.GetStakesWithOngoingRounds(),
		)

		return Promise.all(
			stakes.map(async (stakeRaw) => {
				const currentConfig =
					stakeRaw.configs.length > 0
						? fromConfigRaw(
								stakeRaw.configs[0],
								await this.evmCurrencyService.fromAddress(
									getAddress(stakeRaw.configs[0].currency),
									this.chainId,
								),
							)
						: null

				const stake: Stake = {
					id: Number(stakeRaw.id),
					currentConfig: stakeRaw.deleted ? null : currentConfig,
				}

				const ongoingRounds = await Promise.all(
					stakeRaw.rounds
						.filter((r) => {
							const status = resolveRoundStatus(r.status)
							return ONGOING_STATUSES.has(status)
						})
						.map(async (r) => {
							const currency =
								await this.evmCurrencyService.fromAddress(
									getAddress(r.config.currency),
									this.chainId,
								)

							return fromRoundRaw(
								{ ...r, stakeId: stakeRaw.id },
								currency,
							) as OngoingRound
						}),
				)

				return { stake, ongoingRounds }
			}),
		)
	}
}
