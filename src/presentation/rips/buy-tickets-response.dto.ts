import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { PurchaseReceipt } from '../../domain/value-objects/purchase-receipt'
import { PendingZap } from '../../domain/value-objects/zap'
import { toPlainCurrencyAmount, toPlainTransaction } from '../to-plain'
import { PlainCurrencyAmountZ, PlainTransactionZ } from '../to-plain-schemas'

const PurchaseResponseZ = z.object({
	transaction: PlainTransactionZ,
	roundId: z.number(),
	ticketCount: z.number(),
})

const ZapResponseZ = z.object({
	zapId: z.string(),
	srcTransaction: PlainTransactionZ,
	amountIn: PlainCurrencyAmountZ,
	fee: PlainCurrencyAmountZ,
	durationMs: z.number(),
})

export class PurchaseResponseDto extends createZodDto(PurchaseResponseZ) {}
export class ZapResponseDto extends createZodDto(ZapResponseZ) {}

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
