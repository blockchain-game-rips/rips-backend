import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { getAddress } from 'viem'
import { Prisma } from '../../../generated/prisma-indexer'
import { PresetRepository } from '../../application/interfaces/repositories/preset.repository'
import { Preset } from '../../domain/entities/preset'
import {
	COMPLETED_STATUSES,
	isOngoingRip,
	OngoingRip,
} from '../../domain/entities/rip'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { PresetWithOngoingRips } from '../../domain/value-objects/preset-with-ongoing-rips'
import { withCache } from '../cache/with-cache'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerPrismaService } from './indexer-prisma.service'
import { INDEXER_TTL_MS } from './indexer.constants'
import { fromConfigRaw, PresetConfigRaw, ripInclude, toRip } from './utils'

const presetInclude = {
	config: {
		include: {
			payout_tier: { orderBy: { tier_index: 'asc' } },
		},
	},
	rip: {
		where: { status: { notIn: COMPLETED_STATUSES.map(String) } },
		include: ripInclude,
	},
} satisfies Prisma.presetInclude

@Injectable()
export class IndexerPresetRepository extends PresetRepository {
	private readonly chainId: number

	constructor(
		private readonly indexer: IndexerPrismaService,
		private readonly evmCurrencyService: EvmCurrencyService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {
		super()
		this.chainId = Number(contract.chain.reference)
	}

	// config.id is a stringified uint stored as varchar, so the latest
	// config must be chosen by numeric id, not lexicographic order.
	private latestConfig(configs: PresetConfigRaw[]): PresetConfigRaw | null {
		if (configs.length === 0) {
			return null
		}

		return configs.reduce((latest, candidate) =>
			BigInt(candidate.id) > BigInt(latest.id) ? candidate : latest,
		)
	}

	private async resolveCurrentConfig(
		configRaw: PresetConfigRaw,
	): Promise<ReturnType<typeof fromConfigRaw>> {
		const currency = await this.evmCurrencyService.fromAddress(
			getAddress(configRaw.currency),
			this.chainId,
		)

		return fromConfigRaw(configRaw, currency)
	}

	async getPresetsWithOngoingRips(): Promise<PresetWithOngoingRips[]> {
		const presets = await withCache(
			this.cacheManager,
			'indexer-presets-with-ongoing-rips',
			INDEXER_TTL_MS,
			() => this.indexer.preset.findMany({ include: presetInclude }),
		)

		return Promise.all(
			presets.map(async (presetRaw) => {
				const latestConfig = this.latestConfig(presetRaw.config)

				const currentConfig =
					latestConfig != null
						? await this.resolveCurrentConfig(latestConfig)
						: null

				const preset: Preset = {
					id: Number(presetRaw.id),
					currentConfig: presetRaw.deleted ? null : currentConfig,
				}

				const rips = await Promise.all(
					presetRaw.rip.map((ripRaw) =>
						toRip(ripRaw, this.evmCurrencyService, this.chainId),
					),
				)

				const ongoingRips: OngoingRip[] = rips.filter(isOngoingRip)

				return { preset, ongoingRips }
			}),
		)
	}
}
