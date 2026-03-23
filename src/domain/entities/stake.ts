import { CurrencyAmount } from '../value-objects/currency-amount'

export type Stake = {
	id: number
	ticketCup: number
	ticketPrice: CurrencyAmount
	duration: number
}
