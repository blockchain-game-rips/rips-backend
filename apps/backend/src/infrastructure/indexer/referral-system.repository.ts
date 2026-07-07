import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { zeroAddress } from 'viem'
import { Prisma } from '../../../generated/prisma-indexer'
import { ReferralSystemRepository } from '../../application/interfaces/repositories/referral-system.repository'
import { Referrer } from '../../domain/entities/referrer'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { ReferrerTierTable } from '../../domain/value-objects/referral-system'
import { withCache } from '../cache/with-cache'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerPrismaService } from './indexer-prisma.service'
import { INDEXER_TTL_MS } from './indexer.constants'

const REFERRAL_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

type ReferrerReward = Prisma.referrer_rewardGetPayload<true>
type ReferrerStateUpdated = Prisma.referrer_state_updatedGetPayload<true>
type ReferrerCustomFeeUpdated =
	Prisma.referrer_custom_fee_updatedGetPayload<true>
type DefaultReferralFeeUpdated =
	Prisma.default_referral_fee_updatedGetPayload<true>
type ReferralTier = Prisma.referral_tierGetPayload<true>

@Injectable()
export class IndexerReferralSystemRepository extends ReferralSystemRepository {
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

	//TODO: get referral updates for every currency
	async getReferrerByAddress(referrer: EvmAddress): Promise<Referrer> {
		const lowerCaseReferrer = referrer.toLowerCase()

		const {
			referrerRewards,
			referrerStateUpdateds,
			referralTiers,
			defaultReferralFeeUpdateds,
			referrerCustomFeeUpdateds,
			referrerFreezeUpdateds,
		} = await withCache(
			this.cacheManager,
			`indexer-referrer-${lowerCaseReferrer}`,
			INDEXER_TTL_MS,
			() => this.fetchReferrerData(lowerCaseReferrer),
		)

		const customFee = this.resolveCustomFee(referrerCustomFeeUpdateds)

		const defaultFee = this.resolveDefaultFee(defaultReferralFeeUpdateds)

		const { activeFee, currMonthVolume, monthStartTime } =
			this.resolveVolumeActiveFeeMonthStart(
				referrerStateUpdateds,
				referralTiers,
			)

		const rewards = this.resolveRewards(referrerRewards)
		const currency = await this.evmCurrencyService.fromAddress(
			zeroAddress,
			this.chainId,
		)
		const fee = customFee ?? Math.max(defaultFee, activeFee)

		const isFrozen = referrerFreezeUpdateds[0]?.frozen ?? false

		return {
			address: referrer,
			isFrozen,
			states: [
				{
					currency,
					fee,
					rewards,
					period: {
						volume: currMonthVolume,
						startTime: monthStartTime,
					},
				},
			],
		}
	}

	private async fetchReferrerData(referrer: string) {
		const [
			referrerRewards,
			referrerStateUpdateds,
			referrerCustomFeeUpdateds,
			defaultReferralFeeUpdateds,
			latestTiersUpdate,
			referrerFreezeUpdateds,
		] = await Promise.all([
			this.indexer.referrer_reward.findMany({
				where: { referrer, currency: zeroAddress },
				take: 1,
			}),
			this.indexer.referrer_state_updated.findMany({
				where: { referrer, currency: zeroAddress },
				orderBy: { block_number: 'desc' },
				take: 1,
			}),
			this.indexer.referrer_custom_fee_updated.findMany({
				where: { referrer },
				orderBy: { block_number: 'desc' },
				take: 1,
			}),
			this.indexer.default_referral_fee_updated.findMany({
				orderBy: { block_number: 'desc' },
				take: 1,
			}),
			this.indexer.referral_tiers_updated.findFirst({
				where: { currency: zeroAddress },
				orderBy: { block_number: 'desc' },
				include: { referral_tier: true },
			}),
			this.indexer.referrer_freeze_updated.findMany({
				where: { referrer },
				orderBy: { block_number: 'desc' },
				take: 1,
			}),
		])

		return {
			referrerRewards,
			referrerStateUpdateds,
			referrerCustomFeeUpdateds,
			defaultReferralFeeUpdateds,
			referralTiers: latestTiersUpdate?.referral_tier ?? [],
			referrerFreezeUpdateds,
		}
	}

	private resolveRewards(referrerRewards: ReferrerReward[]): {
		available: bigint
		withdrawn: bigint
	} {
		if (referrerRewards.length === 0)
			return { available: 0n, withdrawn: 0n }

		const rewardState = referrerRewards[0]
		const accrued = BigInt(rewardState.accrued.toFixed(0))
		const seized = BigInt(rewardState.seized.toFixed(0))
		const withdrawn = BigInt(rewardState.withdrawn.toFixed(0))

		return {
			available: accrued - seized - withdrawn,
			withdrawn,
		}
	}

	private resolveDefaultFee(
		defaultReferralFeeUpdateds: DefaultReferralFeeUpdated[],
	): number {
		if (defaultReferralFeeUpdateds.length === 0) return 0

		return defaultReferralFeeUpdateds[0].default_referral_fee
	}

	private resolveCustomFee(
		customFeeUpdates: ReferrerCustomFeeUpdated[],
	): number | null {
		if (customFeeUpdates.length === 0) return null

		const customFee = customFeeUpdates[0].custom_fee_percent

		// will be applyed another fee if custom fee overriden to 0
		if (customFee === 0) return null

		return customFee
	}

	private resolveActiveFeeFromTiers(
		tiers: ReferralTier[],
		volume: bigint,
	): number {
		if (tiers.length === 0) return 0

		const sorted = [...tiers].sort((a, b) =>
			Number(
				BigInt(a.min_volume.toFixed(0)) -
					BigInt(b.min_volume.toFixed(0)),
			),
		)

		let activeFee = 0

		for (const tier of sorted) {
			if (volume >= BigInt(tier.min_volume.toFixed(0))) {
				activeFee = tier.fee_percent
			}
		}

		return activeFee
	}

	private resolveVolumeActiveFeeMonthStart(
		stateUpdates: ReferrerStateUpdated[],
		tiers: ReferralTier[],
	): {
		activeFee: number
		monthStartTime: Date | null
		currMonthVolume: bigint
	} {
		if (stateUpdates.length === 0)
			return {
				activeFee: 0,
				currMonthVolume: 0n,
				monthStartTime: null,
			}

		const lastStateUpdate = stateUpdates[0]
		const storedMonthStart = lastStateUpdate.period_start_time
		const now = Date.now()

		const elapsedPeriods = Math.floor(
			(now - storedMonthStart.getTime()) / REFERRAL_PERIOD_MS,
		)

		if (elapsedPeriods === 0) {
			return {
				activeFee: lastStateUpdate.active_fee_percent,
				monthStartTime: storedMonthStart,
				currMonthVolume: BigInt(
					lastStateUpdate.period_volume.toFixed(0),
				),
			}
		}

		const monthStartTime = new Date(
			storedMonthStart.getTime() + elapsedPeriods * REFERRAL_PERIOD_MS,
		)

		return {
			activeFee: this.resolveActiveFeeFromTiers(tiers, 0n),
			monthStartTime,
			currMonthVolume: 0n,
		}
	}

	async getReferrerTierTables(): Promise<ReferrerTierTable[]> {
		const { latestTiersUpdate, defaultReferralFeeUpdateds } =
			await withCache(
				this.cacheManager,
				'indexer-referrer-tier-tables',
				INDEXER_TTL_MS,
				() => this.fetchTierTables(),
			)

		if (latestTiersUpdate == null) return []

		const defaultFeePercent = this.resolveDefaultFee(
			defaultReferralFeeUpdateds,
		)

		const currency = await this.evmCurrencyService.fromAddress(
			zeroAddress,
			this.chainId,
		)

		const tiers = [...latestTiersUpdate.referral_tier]
			.sort((a, b) =>
				Number(
					BigInt(a.min_volume.toFixed(0)) -
						BigInt(b.min_volume.toFixed(0)),
				),
			)
			.map((tier) => ({
				minVolume: BigInt(tier.min_volume.toFixed(0)),
				feeBps: tier.fee_percent,
			}))

		return [{ currency, defaultFeePercent, tiers }]
	}

	private async fetchTierTables() {
		const [latestTiersUpdate, defaultReferralFeeUpdateds] =
			await Promise.all([
				this.indexer.referral_tiers_updated.findFirst({
					where: { currency: zeroAddress },
					orderBy: { block_number: 'desc' },
					include: { referral_tier: true },
				}),
				this.indexer.default_referral_fee_updated.findMany({
					orderBy: { block_number: 'desc' },
					take: 1,
				}),
			])

		return { latestTiersUpdate, defaultReferralFeeUpdateds }
	}
}
