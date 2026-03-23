import { CurrencyAmount } from '../value-objects/currency-amount'

export type Stake = {
	ticketCup: number
	ticketPrice: CurrencyAmount
	duration: number
}
