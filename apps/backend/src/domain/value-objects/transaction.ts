import { CurrencyAmount } from './currency-amount'

export type Transaction = {
	id: string
	cost?: CurrencyAmount
}

export type TransactionQuote = {
	blockchainFee: CurrencyAmount
}
