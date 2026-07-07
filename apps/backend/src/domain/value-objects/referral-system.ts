import { Currency } from '../entities/currency'

export type ReferrerTier = {
	minVolume: bigint
	feeBps: number
}

export type ReferrerTierTable = {
	currency: Currency
	defaultFeePercent: number
	tiers: ReferrerTier[]
}
