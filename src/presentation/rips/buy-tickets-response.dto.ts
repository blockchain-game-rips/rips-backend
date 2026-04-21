import { PurchaseReceipt } from '../../domain/value-objects/purchase-receipt'
import { PendingZap } from '../../domain/value-objects/zap'
import {
	PlainCurrencyAmount,
	PlainTransaction,
	toPlainCurrencyAmount,
	toPlainTransaction,
} from '../to-plain'

export type PurchaseResponseDto = {
	transaction: PlainTransaction
	roundId: number
	ticketCount: number
}

export type ZapResponseDto = {
	zapId: string
	srcTransaction: PlainTransaction
	amountIn: PlainCurrencyAmount
	fee: PlainCurrencyAmount
	durationMs: number
}

export function toPurchaseResponseDto(
	receipt: PurchaseReceipt,
): PurchaseResponseDto {
	return {
		transaction: toPlainTransaction(receipt.transaction),
		roundId: receipt.purchase.roundId,
		ticketCount: receipt.purchase.ticketCount,
	}
}

export function toZapResponseDto(pendingZap: PendingZap): ZapResponseDto {
	return {
		zapId: pendingZap.zapId,
		srcTransaction: toPlainTransaction(pendingZap.srcTransaction),
		amountIn: toPlainCurrencyAmount(pendingZap.amountIn),
		fee: toPlainCurrencyAmount(pendingZap.fee),
		durationMs: pendingZap.durationMs,
	}
}
