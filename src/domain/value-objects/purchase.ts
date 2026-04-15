import { CurrencyAmount } from './currency-amount'

export type Purchase = {
	ticketCount: number
	roundId: number
	leftover?: CurrencyAmount
}
