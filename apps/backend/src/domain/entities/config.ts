import { CurrencyAmount } from '../value-objects/currency-amount'

export type PayoutTier = {
	payoutCount: bigint
	minPayout: bigint
	maxPayout: bigint
}

export type Config = {
	id: number
	entryCap: number
	feeBps: number
	entryPrice: CurrencyAmount
	durationSeconds: number
	payoutDistribution: PayoutTier[]
}
