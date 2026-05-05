import { CurrencyAmount } from '../value-objects/currency-amount'

export type PrizeTier = {
	prizeCount: bigint
	minPrize: bigint
	maxPrize: bigint
}

export type Config = {
	id: number
	//TODO: rename
	ticketCup: number
	feePercent: number
	ticketPrice: CurrencyAmount
	durationSeconds: number
	prizeDistribution: PrizeTier[]
}
