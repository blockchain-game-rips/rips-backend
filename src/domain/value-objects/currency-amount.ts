import { Currency } from '../entities/currency'

export interface CurrencyAmount {
	token: Currency
	amount: bigint
}
