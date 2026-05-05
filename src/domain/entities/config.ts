import { CurrencyAmount } from '../value-objects/currency-amount'

export type PrizeTier = {
	prizeCount: bigint
	minPrize: bigint
	maxPrize: bigint
}

export type Config = {
	id: number
	ticketCap: number
	feePercent: number
	ticketPrice: CurrencyAmount
	durationSeconds: number
	prizeDistribution: PrizeTier[]
}
