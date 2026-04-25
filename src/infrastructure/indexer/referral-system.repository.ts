import { Inject, Injectable } from '@nestjs/common'
import { zeroAddress } from 'viem'
import { ReferralSystemRepository } from '../../application/interfaces/repositories/referral-system.repository'
import { Referrer } from '../../domain/entities/referrer'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { ReferrerTierTable } from '../../domain/value-objects/referral-system'
import { GetReferrerDataQuery } from '../../generated/graphql/generated'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerService } from './indexer.service'

const REFERRAL_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

@Injectable()
export class IndexerReferralSystemRepository extends ReferralSystemRepository {
	private readonly chainId: number

	constructor(
		private readonly indexer: IndexerService,
		private readonly evmCurrencyService: EvmCurrencyService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
	) {
		super()
		this.chainId = Number(contract.chain.reference)
	}

	//TODO: get referral updates for every currency
	async getReferrerByAddress(referrer: EvmAddress): Promise<Referrer> {
		const lowerCaseReferrer = referrer.toLowerCase()

		const {
			referrerCustomFeeUpdateds,
			referrerStateUpdateds,
			referralTiersUpdateds,
			defaultReferralFeeUpdateds,
			referrerRewardStates,
		} = await this.indexer.sdk.GetReferrerData({
			currencyAddress: zeroAddress,
			referrer: lowerCaseReferrer,
		})

		const customFee = this.resolveCustomFee(referrerCustomFeeUpdateds)

		const defaultFee = this.resolveDefaultFee(defaultReferralFeeUpdateds)

		const { activeFee, currMonthVolume, monthStartTime } =
			this.resolveVolumeActiveFeeMonthStart(
				referrerStateUpdateds,
				referralTiersUpdateds,
			)

		const rewards = this.resolveRewards(referrerRewardStates)
		const currency = await this.evmCurrencyService.fromAddress(
			zeroAddress,
			this.chainId,
		)
		const fee = customFee ?? Math.max(defaultFee, activeFee)

		return {
			address: referrer,
			states: [
				{
					currency,
					fee,
					rewards,
					volume: {
						currentMonth: currMonthVolume,
						monthStart: monthStartTime,
					},
				},
			],
		}
	}

	private resolveRewards(
		referrerRewardStates: GetReferrerDataQuery['referrerRewardStates'],
	): {
		available: bigint
		withdrawn: bigint
	} {
		if (referrerRewardStates.length === 0)
			return { available: 0n, withdrawn: 0n }

		const rewardState = referrerRewardStates[0]
		const accrued = BigInt(rewardState.accrued)
		const seized = BigInt(rewardState.seized)
		const withdrawn = BigInt(rewardState.withdrawn)

		return {
			available: accrued - seized - withdrawn,
			withdrawn,
		}
	}

	private resolveDefaultFee(
		defaultReferralFeeUpdateds: GetReferrerDataQuery['defaultReferralFeeUpdateds'],
	): number {
		if (defaultReferralFeeUpdateds.length === 0) return 0

		return defaultReferralFeeUpdateds[0].defaultReferralFee
	}

	private resolveCustomFee(
		customFeeUpdates: GetReferrerDataQuery['referrerCustomFeeUpdateds'],
	): number | null {
		if (customFeeUpdates.length === 0) return null

		const customFee = customFeeUpdates[0].customFeePercent

		// will be applyed another fee if custom fee overriden to 0
		if (customFee === 0) return null

		return customFee
	}

	private resolveActiveFeeFromTiers(
		referralTiersUpdates: GetReferrerDataQuery['referralTiersUpdateds'],
		volume: bigint,
	): number {
		if (referralTiersUpdates.length === 0) return 0

		const tiers = referralTiersUpdates[0].tiers

		if (tiers.length === 0) return 0

		const sorted = [...tiers].sort((a, b) =>
			Number(BigInt(a.minVolume) - BigInt(b.minVolume)),
		)

		let activeFee = 0

		for (const tier of sorted) {
			if (volume >= BigInt(tier.minVolume)) {
				activeFee = tier.feePercent
			}
		}

		return activeFee
	}

	private resolveVolumeActiveFeeMonthStart(
		stateUpdates: GetReferrerDataQuery['referrerStateUpdateds'],
		referralTiersUpdates: GetReferrerDataQuery['referralTiersUpdateds'],
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
		const storedMonthStart = new Date(lastStateUpdate.monthStartTime)
		const now = Date.now()

		const elapsedPeriods = Math.floor(
			(now - storedMonthStart.getTime()) / REFERRAL_PERIOD_MS,
		)

		if (elapsedPeriods === 0) {
			return {
				activeFee: lastStateUpdate.activeFeePercent,
				monthStartTime: storedMonthStart,
				currMonthVolume: BigInt(lastStateUpdate.currMonthVolume),
			}
		}

		const monthStartTime = new Date(
			storedMonthStart.getTime() + elapsedPeriods * REFERRAL_PERIOD_MS,
		)

		return {
			activeFee: this.resolveActiveFeeFromTiers(referralTiersUpdates, 0n),
			monthStartTime,
			currMonthVolume: 0n,
		}
	}

	async getReferrerTierTables(): Promise<ReferrerTierTable[]> {
		const { referralTiersUpdateds, defaultReferralFeeUpdateds } =
			await this.indexer.sdk.GetReferrerTierTables({
				currencyAddress: zeroAddress,
			})

		if (referralTiersUpdateds.length === 0) return []

		const defaultFeePercent = this.resolveDefaultFee(
			defaultReferralFeeUpdateds,
		)

		const currency = await this.evmCurrencyService.fromAddress(
			zeroAddress,
			this.chainId,
		)

		const tiers = referralTiersUpdateds[0].tiers.map((tier) => ({
			minVolume: BigInt(tier.minVolume),
			feePercent: tier.feePercent,
		}))

		return [{ currency, defaultFeePercent, tiers }]
	}
}
