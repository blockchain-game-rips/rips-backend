import { CurrencyAmount } from './currency-amount'
import { Purchase } from './purchase'
import { Transaction, TransactionQuote } from './transaction'
import {
	TransactionAttempt,
	TransactionAttemptWith,
} from './transaction-attempt'

export type PendingZap = {
	zapId: string
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
	approval?: TransactionAttempt
	swap: TransactionAttemptWith<{ amountOut: CurrencyAmount }>
}

export type SamechainEnterResult = {
	approval?: TransactionAttempt
	enter: TransactionAttemptWith<{ purchase: Purchase }>
}

/*
 * The two crosschain starts share this structure but stay distinct names: the
 * client's next poll differs, and the shapes may diverge later.
 */
export type CrosschainZapStartResult = {
	approval?: TransactionAttempt
	zap: TransactionAttemptWith<PendingZap>
}

export type CrosschainSwapStartResult = CrosschainZapStartResult

export type CrosschainEnterStartResult = CrosschainZapStartResult

export type SamechainEnterQuoteResult = {
	amountIn: CurrencyAmount
	transactionQuote: TransactionQuote
}

export type SamechainSwapQuoteResult = {
	amountOut: CurrencyAmount
	transactionQuote: TransactionQuote
}
