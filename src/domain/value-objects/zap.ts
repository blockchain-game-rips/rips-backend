import { CurrencyAmount } from './currency-amount'
import { Purchase } from './purchase'
import { Transaction } from './transaction'

export type PendingZap = {
	zapId: string
	srcTransaction: Transaction
	amountIn: CurrencyAmount
	fee: CurrencyAmount
	durationMs: number
}

export type ZapResultCancelled = {
	status: 'cancelled'
}

export type ZapResultFailed = {
	status: 'failed'
	refund: CurrencyAmount
}

export type ZapResultSuccess<T> = {
	status: 'success'
	dstTransaction: Transaction
	result: T
}

export type ZapResult<T> =
	| ZapResultCancelled
	| ZapResultFailed
	| ZapResultSuccess<T>

export type ZapBuyResult = ZapResult<Purchase>

export type ZapSwapResult = ZapResult<{
	amountOut: CurrencyAmount
}>

export type ZapQuoteBuyResult = {
	amountIn: bigint
	durationMs: number
	fee: CurrencyAmount
}

export type ZapQuoteSwapResult = {
	amountOut: bigint
	durationMs: number
	fee: CurrencyAmount
}
