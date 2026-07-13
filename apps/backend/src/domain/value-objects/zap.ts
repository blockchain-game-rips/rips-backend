import { CurrencyAmount } from './currency-amount'
import { Purchase } from './purchase'
import { Transaction, TransactionQuote } from './transaction'

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

export type ZapBuyResult =
	| ZapResultCancelled
	| ZapResultFailed
	| ZapResultSuccess<Purchase>

export type ZapSwapResult =
	| ZapResultCancelled
	| ZapResultSuccess<{ amountOut: CurrencyAmount }>

export type ZapQuoteEnterResult = {
	amountIn: CurrencyAmount
	durationMs: number
	fee: CurrencyAmount
	transactionQuote: TransactionQuote
}

export type ZapQuoteSwapResult = {
	amountOut: CurrencyAmount
	durationMs: number
	fee: CurrencyAmount
	transactionQuote: TransactionQuote
}

export type SamechainSwapResult = {
	transaction: Transaction
	amountOut: CurrencyAmount
}

export type SamechainEnterResult = {
	transaction: Transaction
	purchase: Purchase
}

export type SamechainEnterQuoteResult = {
	amountIn: CurrencyAmount
	transactionQuote: TransactionQuote
}

export type SamechainSwapQuoteResult = {
	amountOut: CurrencyAmount
	transactionQuote: TransactionQuote
}
