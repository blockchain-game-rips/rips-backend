import { Currency } from '../entities/currency'

export type CurrencyAmount = {
	currency: Currency
	amount: bigint
}
