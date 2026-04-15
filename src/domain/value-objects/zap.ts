import { CurrencyAmount } from './currency-amount'
import { Purchase } from './purchase'
import { Transaction } from './transaction'

export type PendingZap = {
	srcTransaction: Transaction
	zapId: string
}

export type ZapResult<T> =
	| { status: 'cancelled' }
	| { status: 'failed'; refund: CurrencyAmount }
	| { status: 'success'; transaction: Transaction; result: T }

export type ZapBuyResult = ZapResult<Purchase>

export type ZapSwapResult = ZapResult<{
	amountOut: CurrencyAmount
}>
