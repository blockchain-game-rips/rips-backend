import { PurchaseOutcome } from '../../domain/value-objects/purchase-outcome'
import {
	PlainCurrencyAmount,
	PlainTransaction,
	toPlainCurrencyAmount,
	toPlainTransaction,
} from '../to-plain'

type PurchasedDto = {
	type: 'purchased'
	transaction: PlainTransaction
	roundId: number
	ticketCount: number
}

type ZapDto = {
	type: 'zap'
	zapId: string
	srcTransaction: PlainTransaction
	amountIn: PlainCurrencyAmount
	fee: PlainCurrencyAmount
	durationMs: number
}

export type BuyTicketsResponseDto = PurchasedDto | ZapDto

export function toBuyTicketsResponseDto(
	outcome: PurchaseOutcome,
): BuyTicketsResponseDto {
	if (outcome.type === 'purchased') {
		const { purchase, transaction } = outcome.purchaseReceipt

		return {
			type: 'purchased',
			transaction: toPlainTransaction(transaction),
			roundId: purchase.roundId,
			ticketCount: purchase.ticketCount,
		}
	}

	const { pendingZap } = outcome

	return {
		type: 'zap',
		zapId: pendingZap.zapId,
		srcTransaction: toPlainTransaction(pendingZap.srcTransaction),
		amountIn: toPlainCurrencyAmount(pendingZap.amountIn),
		fee: toPlainCurrencyAmount(pendingZap.fee),
		durationMs: pendingZap.durationMs,
	}
}
