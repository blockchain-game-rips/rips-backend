import { Currency } from '../entities/currency'

export type ReferrerTier = {
	minVolume: bigint
	feePercent: number
}

export type ReferrerTierTable = {
	currency: Currency
	defaultFeePercent: number
	tiers: ReferrerTier[]
}
