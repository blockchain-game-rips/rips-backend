import { CurrencyAmount } from './currency-amount'
import { Transaction } from './transaction'

export type Reward = {
	transaction: Transaction
	amount: CurrencyAmount
}
