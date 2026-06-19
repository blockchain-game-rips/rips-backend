import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { getAddress } from 'viem'
import { PresetRepository } from '../../application/interfaces/repositories/preset.repository'
import { Preset } from '../../domain/entities/preset'
import { OngoingRip, RipStatus } from '../../domain/entities/rip'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { PresetWithOngoingRips } from '../../domain/value-objects/preset-with-ongoing-rips'
import { withCache } from '../cache/with-cache'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerService } from './indexer.service'
import { fromConfigRaw, fromRipRaw, resolveRipStatus } from './utils'

const INDEXER_TTL_MS = 5000

const ONGOING_STATUSES = new Set([
	RipStatus.FILLING,
	RipStatus.SEALED,
	RipStatus.VRF_REQUESTED,
	RipStatus.CLAIMING,
	RipStatus.REFUNDING,
])

@Injectable()
export class IndexerPresetRepository extends PresetRepository {
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

	async getPresetsWithOngoingRips(): Promise<PresetWithOngoingRips[]> {
		const { presets } = await withCache(
			this.cacheManager,
			'indexer-presets-with-ongoing-rips',
			INDEXER_TTL_MS,
			() => this.indexer.sdk.GetPresetsWithOngoingRips(),
		)

		return Promise.all(
			presets.map(async (presetRaw) => {
				const currentConfig =
					presetRaw.configs.length > 0
						? fromConfigRaw(
								presetRaw.configs[0],
								await this.evmCurrencyService.fromAddress(
									getAddress(presetRaw.configs[0].currency),
									this.chainId,
								),
							)
						: null

				const preset: Preset = {
					id: Number(presetRaw.id),
					currentConfig: presetRaw.deleted ? null : currentConfig,
				}

				const ongoingRips = await Promise.all(
					presetRaw.rips
						.filter((r) => {
							const status = resolveRipStatus(r.status)
							return ONGOING_STATUSES.has(status)
						})
						.map(async (r) => {
							const currency =
								await this.evmCurrencyService.fromAddress(
									getAddress(r.config.currency),
									this.chainId,
								)

							return fromRipRaw(
								{ ...r, presetId: presetRaw.id },
								currency,
							) as OngoingRip
						}),
				)

				return { preset, ongoingRips }
			}),
		)
	}
}
